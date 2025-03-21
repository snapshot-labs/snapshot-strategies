import { getAddress } from '@ethersproject/address';
import { formatUnits } from '@ethersproject/units';
import { customFetch } from '../../utils';

export const author = 'miertschink';
export const version = '0.1.1';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const requestBody = {
    options,
    network,
    snapshot,
    addresses
  };

  const response = await customFetch(options.api, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();
  return Object.fromEntries(
    data.score.map((value) => [
      getAddress(value.address),
      parseFloat(formatUnits(value.score.toString(), options.decimals))
    ])
  );
}
