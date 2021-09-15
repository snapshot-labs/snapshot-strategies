import fetch from 'cross-fetch';
import { getAddress } from '@ethersproject/address';
import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';

export const author = 'amptoken';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  return Object.fromEntries(await Promise.all(addresses.map(async (address) => {
    const response = await fetch(`${options.apiBase}/accounts/${getAddress(address)}/totals?snapshot=${snapshot}`, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.flexa.capacity.v1+json'
      }
    });
    const data = await response.json();
    const { supplyTotal = 0, rewardTotal = 0 } = data;
    return [
      address,
      parseFloat(formatUnits(BigNumber.from(supplyTotal).add(rewardTotal), 18)),
    ];
  })));
}
