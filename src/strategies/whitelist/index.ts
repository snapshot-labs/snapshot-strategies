import namehash from '@ensdomains/eth-ens-namehash';
import { multicall } from '../../utils';
export const author = 'bonustrack';
export const version = '0.1.0';

const abi = ['function owner(bytes32) view returns (address)'];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  let whitelist = options?.addresses.map((address) => address.toLowerCase());
  const ENSnames = whitelist.filter((address) => address.includes('.eth'));
  if (ENSnames.length > 0) {
    const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
    const ensResponse = await multicall(
      network,
      provider,
      abi,
      ENSnames.map((name: any) => [
        '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
        'owner',
        [namehash.hash(namehash.normalize(name))]
      ]),
      { blockTag }
    );
    whitelist.push(...ensResponse.flat().map((a) => a.toLowerCase()));
  }
  whitelist = whitelist.filter(
    (a) =>
      a !== '0x0000000000000000000000000000000000000000' || !a.includes('.eth')
  );
  return Object.fromEntries(
    addresses.map((address) => [
      address,
      whitelist.includes(address.toLowerCase()) ? 1 : 0
    ])
  );
}
