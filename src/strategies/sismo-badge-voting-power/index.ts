import { multicall } from '../../utils';

export const author = 'bigq';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address owner, uint256 id) view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const tierWeights = options.tierWeights;
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const response = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      options.address,
      'balanceOf',
      [address, options.tokenId]
    ]),
    { blockTag }
  );
  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      tierWeights[value.toString()]
    ])
  );
}
