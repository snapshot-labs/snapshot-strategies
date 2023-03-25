import { multicall } from '../../utils';

export const author = 'isaac-martin';
export const version = '1.0.0';

const abi = [
  'function balanceOfBatch(address[], uint256[]) external view returns (uint256[])'
];

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
    addresses.map((address: any) => [
      options.address,
      'balanceOfBatch',
      [Array(options.ids.length).fill(address), options.ids]
    ]),
    { blockTag }
  );

  const getWeightCount = (balance: number, currentIndex: number): number => {
    // will either return 0 or 1 depending if the user holds one of these tokens
    const count = Math.min(balance, 1);
    return count * options.weight[currentIndex];
  };

  return Object.fromEntries(
    response.map((values, i) => [
      addresses[i],
      values[0].reduce(
        (prev, curr, currentIndex) =>
          Math.max(prev, getWeightCount(curr.toNumber(), currentIndex)),
        0
      )
    ])
  );
}
