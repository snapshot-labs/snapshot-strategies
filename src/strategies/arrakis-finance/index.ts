import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'MantisClone';
export const version = '0.1.0';

const abi = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function balanceOf(address account) public view returns (uint256)',
  'function totalSupply() public view returns (uint256)',
  'function getUnderlyingBalances() external view returns (uint256 amount0Current, uint256 amount1Current)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });
  multi.call('token0', options.poolAddress, 'token0', []);
  multi.call('token1', options.poolAddress, 'token1', []);
  multi.call('underlyingBalances', options.poolAddress, 'getUnderlyingBalances', []);
  multi.call('lpTokenTotalSupply', options.poolAddress, 'totalSupply', []);
  addresses.forEach((address) =>
    multi.call(`lpTokenBalances.${address}`, options.poolAddress, 'balanceOf', [address])
  );
  const result = await multi.execute();

  const token0 = result.token0;
  const token1 = result.token1;
  const underlyingBalances = result.underlyingBalances;
  const lpTokenTotalSupply = result.lpTokenTotalSupply;
  const lpTokenBalances: Record<string, BigNumberish> = result.lpTokenBalances;

  console.log(token0)
  console.log(token1)
  console.log(underlyingBalances)
  console.log(lpTokenTotalSupply)
  console.log(lpTokenBalances)

  let token0Or1 = NaN
  if (options.tokenAddress === token0) {
    token0Or1 = 0
  }
  else if (options.tokenAddress === token1) {
    token0Or1 = 1
  }
  else {
    throw new Error(
      `token not in pool.
       poolAddress=${options.poolAddress},
       tokenAddress=${options.tokenAddress}`
    )
  }

  console.log(token0Or1);

  return Object.fromEntries(
    Object.entries(lpTokenBalances).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
