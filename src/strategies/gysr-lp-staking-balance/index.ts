import { multicall } from '../../utils';

export const author = 'mitesh-mutha';
export const version = '0.0.1';

const tokenABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)'
];

const poolABI = [
  'function stakingBalances(address user) external view returns (uint256[])',
  'function stakingTokens() external view returns (address[])'
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

  // Fetch pool -> get lp token address
  const poolCallResult = await multicall(
    network,
    provider,
    poolABI,
    [[options.pool, 'stakingTokens', []]],
    { blockTag }
  );
  const lpTokenAddress = poolCallResult[0][0][0];

  // Fetch balances from lp token
  const callResult = await multicall(
    network,
    provider,
    tokenABI,
    [
      [lpTokenAddress, 'totalSupply', []],
      [options.tokenAddress, 'balanceOf', [lpTokenAddress]]
    ],
    { blockTag }
  );
  const totalSupply = callResult[0];
  const rewardTokenBalance = callResult[1];
  const rewardTokensPerLP =
    rewardTokenBalance / 10 ** options.decimals / (totalSupply / 1e18);

  // Fetch balances
  const balanceResult = await multicall(
    network,
    provider,
    poolABI,
    addresses.map((address: any) => [
      options.pool,
      'stakingBalances',
      [address]
    ]),
    { blockTag }
  );

  // Final result
  return Object.fromEntries(
    balanceResult.map((value, i) => [
      addresses[i],
      (value / 10 ** options.decimals) * rewardTokensPerLP
    ])
  );
}
