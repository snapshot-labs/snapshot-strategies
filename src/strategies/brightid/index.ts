import { multicall } from '../../utils';
import examplesFile from './examples.json';

export const author = 'bonustrack';
export const version = '0.1.0';
export const examples = examplesFile;

const abi = [
  'function isVerifiedUser(address _user) external view returns (bool)'
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
      options.registry,
      'isVerifiedUser',
      [address]
    ]),
    { blockTag }
  );
  return Object.fromEntries(
    response.map((value, i) => [addresses[i], value[0] ? 1 : 0])
  );
}
