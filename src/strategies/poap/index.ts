import { getAddress } from '@ethersproject/address';
import { strategy as erc721Strategy } from '../erc721';

export const author = 'greenealexander';
export const version = '1.0.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  _options,
  snapshot
) {
  const results = await erc721Strategy(
    space,
    network,
    provider,
    addresses,
    { address: '0x22C1f6050E56d2876009903609a2cC3fEf83B415' },
    snapshot
  );
  return addresses.reduce((map, address) => {
    map[getAddress(address)] = results[address] ?? 0;
    return map;
  }, {});
}
