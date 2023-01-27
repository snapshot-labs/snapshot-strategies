import { BigNumberish, BigNumber } from '@ethersproject/bignumber';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { Contract } from '@ethersproject/contracts';
import { defaultAbiCoder } from '@ethersproject/abi';
import { strategy as fetchERC20Balances } from '../erc20-balance-of';
import { getAddress } from '@ethersproject/address';

export const author = 'paraswap';
export const version = '0.1.0';

const BalancerVaultAbi = [
  'function getPoolTokens(bytes32 poolId) external view returns (address[] tokens, uint256[] balances, uint256 lastChangeBlock)'
];
interface PoolTokensFromVault {
  tokens: string[];
  balances: BigNumber[];
  lastChangeBlock: BigNumber;
}

const BalancerHelpersAbi = [
  'function queryExit(bytes32 poolId, address sender, address recipient, tuple(address[] assets, uint256[] minAmountsOut, bytes userData, bool toInternalBalance) request) returns (uint256 bptIn, uint256[] amountsOut)'
];

interface QueryExitResult {
  bptIn: BigNumber;
  amountsOut: BigNumber[];
}

interface StrategyOptions {
  address: string;
  symbol: string;
  decimals: number;
  sePSP2: { address: string; decimals: number };
  balancer: {
    poolId: string;
    BalancerHelpers: string;
    Vault: string;
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
    options.sePSP2,
    snapshot
  );

  const balancerVault = new Contract(
    options.balancer.Vault,
    BalancerVaultAbi,
    provider
  );

  const { tokens: poolTokens }: PoolTokensFromVault =
    await balancerVault.getPoolTokens(options.balancer.poolId, { blockTag });

  const tokenLowercase = options.address.toLowerCase();
  const tokenIndex = poolTokens.findIndex(
    (token) => token.toLowerCase() === tokenLowercase
  );

  if (tokenIndex === -1) {
    throw new Error(
      `Token ${options.address} doesn't belong to Balancer Pool ${options.balancer.poolId}`
    );
  }

  const balancerHelpers = new Contract(
    options.balancer.BalancerHelpers,
    BalancerHelpersAbi,
    provider
  );

  const exitPoolRequest = constructExitPoolRequest(
    poolTokens,
    // how much will get for 1 BPT
    parseUnits('1', options.sePSP2.decimals)
  );

  const queryExitResult: QueryExitResult =
    await balancerHelpers.callStatic.queryExit(
      options.balancer.poolId,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      exitPoolRequest,
      { blockTag }
    );

  const pspFor1BPT = parseFloat(
    formatUnits(queryExitResult.amountsOut[tokenIndex], options.decimals)
  );

  const address2PSPinSePSP2 = Object.fromEntries(
    Object.entries(account2BPTBalance).map(([address, bptBalance]) => {
      const pspBalance = pspFor1BPT * bptBalance;

      const checksummedAddress = getAddress(address);

      return [checksummedAddress, pspBalance * options.multiplier];
    })
  );

  return address2PSPinSePSP2;
}

interface ExitPoolRequest {
  assets: string[];
  minAmountsOut: BigNumberish[];
  userData: string;
  toInternalBalance: boolean;
}

// ExitKind enum for BalancerHerlpers.queryExit call
const EXACT_BPT_IN_FOR_TOKENS_OUT = 1;

export function constructExitPoolRequest(
  assets: string[],
  bptAmountIn: BigNumberish
): ExitPoolRequest {
  const abi = ['uint256', 'uint256'];
  const data = [EXACT_BPT_IN_FOR_TOKENS_OUT, bptAmountIn];
  const userData = defaultAbiCoder.encode(abi, data);

  const minAmountsOut = assets.map(() => 0);

  return {
    assets,
    minAmountsOut,
    userData,
    toInternalBalance: false
  };
}
