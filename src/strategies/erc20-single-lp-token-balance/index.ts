import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller, call } from '../../utils';

export const author = 'joehquak';
export const version = '0.1';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)'
];

const lpAbi = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function totalSupply() external view returns (uint256)',
  'function getReserves() external view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast)'
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

  const tokenDecimals = await call(
    provider,
    abi,
    [options.tokenAddress, 'decimals', []],
    { blockTag }
  );

  const lpDecimals = await call(
    provider,
    abi,
    [options.lpTokenAddress, 'decimals', []],
    { blockTag }
  );

  const token0Address = await call(
    provider,
    lpAbi,
    [options.lpTokenAddress, 'token0', []],
    { blockTag }
  );

  const token1Address = await call(
    provider,
    lpAbi,
    [options.lpTokenAddress, 'token1', []],
    { blockTag }
  );

  const lpTokenReserves = await call(
    provider,
    lpAbi,
    [options.lpTokenAddress, 'getReserves', []],
    { blockTag }
  );

  const lpTokenTotalSupply = await call(
    provider,
    lpAbi,
    [options.lpTokenAddress, 'totalSupply', []],
    { blockTag }
  );

  let tokenWeight;

  if (token0Address === options.tokenAddress) {

    tokenWeight = (parseFloat(formatUnits(lpTokenReserves._reserve0, tokenDecimals)) / parseFloat(formatUnits(lpTokenTotalSupply, lpDecimals))) * 2

  } else if (token1Address === options.tokenAddress) {

    tokenWeight = (parseFloat(formatUnits(lpTokenReserves._reserve1, tokenDecimals)) / parseFloat(formatUnits(lpTokenTotalSupply, lpDecimals))) * 2

  } else {

    tokenWeight = 0;

  }

  const lpBalances = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    lpBalances.call(address, options.lpTokenAddress, 'balanceOf', [address])
  );
  const lpBalancesResult: Record<string, BigNumberish> = await lpBalances.execute();


  const tokenBalances = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    tokenBalances.call(address, options.tokenAddress, 'balanceOf', [address])
  );
  const tokenBalancesResult: Record<string, BigNumberish> = await tokenBalances.execute();

  return Object.fromEntries(
    Object.entries(lpBalancesResult).map(([address, balance]) => [
      address,
      (parseFloat(formatUnits(balance, lpDecimals)) * tokenWeight) + parseFloat((formatUnits(tokenBalancesResult[address], tokenDecimals)))
    ])
  );
}
