import { getAddress } from '@ethersproject/address';
import { strategy as erc721Strategy } from '../erc721';

export const author = 'greenealexander';
export const version = '1.0.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const lowercaseAddresses = addresses.map((a) => a.toLowerCase());
  const results = await erc721Strategy(
    space,
    network,
    provider,
    lowercaseAddresses,
    options,
    snapshot
  );
  return lowercaseAddresses.reduce((map, address) => {
    map[getAddress(address)] = results[address] ?? 0;
    return map;
  }, {});
}
