import { getAddress } from '@ethersproject/address';

export const author = 'bonustrack';
export const version = '0.1.0';

export async function strategy(space, network, provider, addresses, options) {
  const whitelist = options?.addresses.map((address) => address.toLowerCase());
  return Object.fromEntries(
    addresses.map((address) => [
      getAddress(address),
      whitelist.includes(address.toLowerCase()) ? 1 : 0
    ])
  );
}
