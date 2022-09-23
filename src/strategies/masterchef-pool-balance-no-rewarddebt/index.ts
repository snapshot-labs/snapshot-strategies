import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'defimatt';
export const version = '0.0.1';

/*
 * Masterchef pool balance strategy. Differs from strategy masterchef-pool-balance by working with masterchefs
 * that only return an amount from userInfo, not a rewardDebt.
 * Accepted options:
 * - chefAddress: masterchef contract address
 * - pid: mastechef pool id (starting with zero)
 * - uniPairAddress: address of a uniswap pair (or a sushi pair or any other with the same interface)
 *    - if the uniPairAddress option is provided, converts staked LP token balance to base token balance
 *      (based on the pair total supply and base token reserve)
 *    - if uniPairAddress is null or undefined, returns staked token balance as is
 * - tokenIndex: index of a token in LP pair, optional, by default 0
 * - weight: integer multiplier of the result (for combining strategies with different weights, totally optional)
 */

const abi = [
  'function userInfo(uint256, address) view returns (uint256 amount)',
  'function totalSupply() view returns (uint256)',
  'function getReserves() view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast)'
];

// calls is a 1-dimensional array so we just push 3 calls for every address
const getCalls = (addresses: any[], options: any) => {
  const result: any[] = [];
  for (const address of addresses) {
    result.push([options.chefAddress, 'userInfo', [options.pid, address]]);
    if (options.uniPairAddress != null) {
      result.push([options.uniPairAddress, 'totalSupply', []]);
      result.push([options.uniPairAddress, 'getReserves', []]);
    }
  }
  return result;
};

function arrayChunk<T>(arr: T[], chunkSize: number): T[][] {
  const result: T[][] = [];
  for (let i = 0, j = arr.length; i < j; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize));
  }
  return result;
}

// values is an array of (chunked) call results for every input address
// for setups with uniPairAddress each chunk has 3 items, for setups without, only 1 item
function processValues(values: any[], options: any): number {
  const poolStaked = values[0][0];
  const weight: BigNumber = BigNumber.from(options.weight || 1);
  const weightDecimals: BigNumber = BigNumber.from(10).pow(
    BigNumber.from(options.weightDecimals || 0)
  );
  let result: BigNumber;
  if (!options.uniPairAddress) {
    result = poolStaked.mul(weight).div(weightDecimals);
  } else {
    const uniTotalSupply = values[1][0];
    const uniReserve = values[2][options.tokenIndex || 0];
    const precision = BigNumber.from(10).pow(18);
    const tokensPerLp = uniReserve.mul(precision).div(uniTotalSupply);
    result = poolStaked
      .mul(tokensPerLp)
      .mul(weight)
      .div(weightDecimals)
      .div(precision);
  }
  return parseFloat(formatUnits(result.toString(), options.decimals || 18));
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const response = await multicall(
    network,
    provider,
    abi,
    getCalls(addresses, options),
    { blockTag }
  );
  return Object.fromEntries(
    // chunk to response so that we can process values for each address
    arrayChunk(response, options.uniPairAddress == null ? 1 : 3).map(
      (value, i) => [addresses[i], processValues(value, options)]
    )
  );
}
