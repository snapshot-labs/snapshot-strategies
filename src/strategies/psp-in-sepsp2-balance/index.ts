import { BigNumberish, BigNumber } from '@ethersproject/bignumber';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { Contract } from '@ethersproject/contracts';
import { defaultAbiCoder } from '@ethersproject/abi';
import { strategy as fetchERC20Balances } from '../erc20-balance-of';
import { Multicaller } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = 'paraswap';
export const version = '0.1.0';

// const abi = [
//   'function PSPBalance(address _account) view returns (uint256 pspAmount_)'
// ];

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

type QueryExitInput = [
  poolId: string,
  sender: string,
  recipient: string,
  exitRequest: ExitPoolRequest
];

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

  const erc20Options = {
    ...options.sePSP2,
    symbol: 'sePSP2'
  };

  const account2BPTBalance = await fetchERC20Balances(
    space,
    network,
    provider,
    addresses,
    erc20Options,
    snapshot
  );

  console.log('account2BPTBalance', account2BPTBalance);

  const balancerVault = new Contract(
    options.balancer.Vault,
    BalancerVaultAbi,
    provider
  );

  const { tokens: poolTokens }: PoolTokensFromVault =
    await balancerVault.getPoolTokens(options.balancer.poolId);

  const tokenLowercase = options.address.toLowerCase();
  const tokenIndex = poolTokens.findIndex(
    (token) => token.toLowerCase() === tokenLowercase
  );

  if (tokenIndex === -1) {
    throw new Error(
      `Token ${options.address} doesn't belong to Balancer Pool ${options.balancer.poolId}`
    );
  }

  const multi = new Multicaller(network, provider, BalancerHelpersAbi, {
    blockTag
  });

  Object.entries(account2BPTBalance).forEach(([address, _bptBalance]) => {
    try {
      const bptBalance = parseUnits(
        _bptBalance.toString(10),
        options.sePSP2.decimals
      );
      const exitPoolRequest = constructExitPoolRequest(poolTokens, bptBalance);
      const params: QueryExitInput = [
        options.balancer.poolId,
        ZERO_ADDRESS,
        ZERO_ADDRESS,
        exitPoolRequest
      ];

      return multi.call(
        address,
        options.balancer.BalancerHelpers,
        'queryExit',
        params
      );
    } catch (error) {
      console.log(error);
    }
  });

  const address2ExitResult: Record<string, QueryExitResult> =
    await multi.execute();

  const address2PSPinSePSP2 = Object.fromEntries(
    Object.entries(address2ExitResult).map(([address, exitResult]) => {
      const pspBalance = exitResult.amountsOut[tokenIndex];

      const checksummedAddress = getAddress(address);

      return [
        checksummedAddress,
        parseFloat(formatUnits(pspBalance, options.decimals)) *
          options.multiplier
      ];
    })
  );

  console.log('FINAL SCORE', address2PSPinSePSP2);

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
