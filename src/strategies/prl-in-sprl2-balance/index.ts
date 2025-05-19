import { formatUnits, parseUnits } from '@ethersproject/units';
import { Contract } from '@ethersproject/contracts';
import { strategy as fetchERC20Balances } from '../erc20-balance-of';
import { getAddress } from '@ethersproject/address';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'Cooperlabs';
export const version = '0.1.0';

const BPTAbi = [
  'function getTokens() external view returns (address[] tokens)'
];

const BalancerRouterAbi = [
  'function queryRemoveLiquidityProportional(address pool, uint256 exactBptAmountIn, address sender, bytes memory userData) external returns (uint256[] memory amountsOut)'
];

interface StrategyOptions {
  PRL: {
    address: string;
    decimals: number;
  };
  sPRL2: { address: string; decimals: number };
  balancerV3: {
    bpt: string;
    router: string;
  };
  multiplier: number;
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export async function strategy(
  space: string,
  network: string,
  provider,
  addresses: string[],
  options: StrategyOptions,
  snapshot: number
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const account2BPTBalance = await fetchERC20Balances(
    space,
    network,
    provider,
    addresses,
    options.sPRL2,
    snapshot
  );

  const bptContract = new Contract(options.balancerV3.bpt, BPTAbi, provider);
  const poolTokens: string[] = await bptContract.getTokens();

  const prlAddressLowercase = options.PRL.address.toLowerCase();
  const prlTokenIndex = poolTokens.findIndex(
    (token) => token.toLowerCase() === prlAddressLowercase
  );

  if (prlTokenIndex === -1) {
    throw new Error(
      `Token ${prlAddressLowercase} doesn't belong to Balancer Pool ${options.balancerV3.bpt}`
    );
  }

  const balancerRouter = new Contract(
    options.balancerV3.router,
    BalancerRouterAbi,
    provider
  );

  const amountsOut: BigNumber[] =
    await balancerRouter.callStatic.queryRemoveLiquidityProportional(
      options.balancerV3.bpt,
      parseUnits('1', options.sPRL2.decimals),
      ZERO_ADDRESS,
      '0x',
      { blockTag }
    );

  const prlFor1BPT = parseFloat(
    formatUnits(amountsOut[prlTokenIndex], options.PRL.decimals)
  );

  /// @dev BPT is a 80PRL/20Weth pool, we extrapolate the PRL amount as it was 100% of the pool
  const prlFor1BPTExtrapolated = prlFor1BPT * 1.25;

  const address2PRLInSPRL2 = Object.fromEntries(
    Object.entries(account2BPTBalance).map(([address, bptBalance]) => {
      const prlBalance = prlFor1BPTExtrapolated * bptBalance;

      const checksummedAddress = getAddress(address);

      return [checksummedAddress, prlBalance * options.multiplier];
    })
  );

  return address2PRLInSPRL2;
}
