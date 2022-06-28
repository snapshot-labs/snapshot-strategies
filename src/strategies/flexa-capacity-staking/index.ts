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
  const apiUrl = `${options.apiBase}/accounts?addresses=${addresses.join(
    ','
  )}&snapshot=${snapshot}`;

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.flexa.capacity.v1+json'
    }
  });
  const data = await response.json();

  return Object.fromEntries(
    data.map((value) => {
      const { supplyTotal = 0, rewardTotal = 0 } = value;
      return [
        getAddress(value.address),
        parseFloat(
          formatUnits(BigNumber.from(supplyTotal).add(rewardTotal), 18)
        )
      ];
    })
  );
}
