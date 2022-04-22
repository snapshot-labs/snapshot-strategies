import { multicall } from '../../utils';

export const author = 'naomsa';
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

  return Object.fromEntries(
    response.map((values, i) => [
      addresses[i],
      values[0].reduce((prev, curr) => prev + curr.toNumber(), 0)
    ])
  );
}
