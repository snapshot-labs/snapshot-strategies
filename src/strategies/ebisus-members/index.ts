import { multicall } from '../../utils';

export const author = 'schwiz';
export const version = '0.1.0';

const abi = [
  'function isMember(address) view returns (bool)'
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
    addresses.map((address: any) => [options.address, 'isMember', [address]]),
    { blockTag }
  );
  return Object.fromEntries(
    response.map((value, i) => {
      return [
        addresses[i],
        value[0] ? 1 : 0
      ]
    })
  );
}
