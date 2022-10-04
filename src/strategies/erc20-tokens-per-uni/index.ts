import { multicall } from '../../utils';

export const author = 'programmablewealth';
export const version = '0.0.1';

const tokenAbi = [
  'function balanceOf(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)'
];

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const poolTokensBalanceQueries = addresses.map((address: string) => [
    options.poolTokenAddress,
    'balanceOf',
    [address]
  ]);

  const res = await multicall(
    network,
    provider,
    tokenAbi,
    [
      ...poolTokensBalanceQueries,
      [options.poolTokenAddress, 'totalSupply', []],
      [options.erc20TokenAddress, 'balanceOf', [options.poolTokenAddress]]
    ],
    { blockTag }
  );

  const tokensPerUni = (balanceInUni: number, totalSupply: number) => {
    return balanceInUni / 1e18 / (totalSupply / 1e18);
  };

  const entries = {};
  for (let addressIndex = 0; addressIndex < addresses.length; addressIndex++) {
    const address = addresses[addressIndex];
    const result =
      res[addressIndex] *
      tokensPerUni(
        res[poolTokensBalanceQueries.length + 1],
        res[poolTokensBalanceQueries.length]
      );
    entries[address] = Number(result.toString()) / 1e18;
  }

  return entries;
}
