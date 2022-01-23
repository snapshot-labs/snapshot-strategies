import { multicall } from '../../utils';

export const author = 'doodley1';
export const version = '0.1.0';

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
  const tokenMethodAbi = tokenAbi.concat(options.methodABI);
  const methodName = options.methodABI['name'];
  const res = await multicall(
    network,
    provider,
    tokenMethodAbi,
    [
      [options.uniswapAddress, 'totalSupply', []],
      [options.tokenAddress, 'balanceOf', [options.uniswapAddress]]
    ].concat(
      addresses.map((address: any) => [
        options.stakingAddress,
        methodName,
        [address]
      ])
    ),
    { blockTag }
  );

  const totalSupply = res[0];
  const tokenBalanceInUni = res[1];
  const tokensPerUni =
    tokenBalanceInUni / 10 ** options.decimals / (totalSupply / 1e18);

  const response = res.slice(2);

  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      (value / 10 ** options.decimals) * tokensPerUni
    ])
  );
}
