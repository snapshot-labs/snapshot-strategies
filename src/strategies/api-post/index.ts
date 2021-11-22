import fetch from 'cross-fetch';
import { formatUnits } from '@ethersproject/units';

export const author = 'polychainmonsters';
export const version = '0.1.0';

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

  const response = await fetch(options.api, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();
  return Object.fromEntries(
    data.scores.map((value) => [
      value.address,
      parseFloat(formatUnits(value.score.toString(), options.decimals))
    ])
  );
}
