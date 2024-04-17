import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller, multicall } from '../../utils';

export const author = 'joehquak';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
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

  // fetch all token and lp contract data

  const fetchContractData = await multicall(
    network,
    provider,
    abi,
    [
      [options.lpTokenAddress, 'token0', []],
      [options.lpTokenAddress, 'token1', []],
      [options.lpTokenAddress, 'getReserves', []],
      [options.lpTokenAddress, 'totalSupply', []],
      [options.lpTokenAddress, 'decimals', []],
      [options.tokenAddress, 'decimals', []]
    ],
    { blockTag }
  );

  // assign multicall data to variables

  const token0Address = fetchContractData[0][0];
  const token1Address = fetchContractData[1][0];
  const lpTokenReserves = fetchContractData[2];
  const lpTokenTotalSupply = fetchContractData[3][0];
  const lpTokenDecimals = fetchContractData[4][0];
  const tokenDecimals = fetchContractData[5][0];

  // calculate single lp token weight

  let tokenWeight;

  if (token0Address === options.tokenAddress) {
    tokenWeight =
      (parseFloat(formatUnits(lpTokenReserves._reserve0, tokenDecimals)) /
        parseFloat(formatUnits(lpTokenTotalSupply, lpTokenDecimals))) *
      2;
  } else if (token1Address === options.tokenAddress) {
    tokenWeight =
      (parseFloat(formatUnits(lpTokenReserves._reserve1, tokenDecimals)) /
        parseFloat(formatUnits(lpTokenTotalSupply, lpTokenDecimals))) *
      2;
  } else {
    tokenWeight = 0;
  }

  const lpBalances = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    lpBalances.call(address, options.lpTokenAddress, 'balanceOf', [address])
  );
  const lpBalancesResult: Record<string, BigNumberish> =
    await lpBalances.execute();

  const tokenBalances = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    tokenBalances.call(address, options.tokenAddress, 'balanceOf', [address])
  );
  const tokenBalancesResult: Record<string, BigNumberish> =
    await tokenBalances.execute();

  return Object.fromEntries(
    Object.entries(lpBalancesResult).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, lpTokenDecimals)) * tokenWeight +
        parseFloat(formatUnits(tokenBalancesResult[address], tokenDecimals))
    ])
  );
}
