import fetch from 'cross-fetch';

export const author = 'blockzerolabs';
export const version = '0.2.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const apiUrl = options.api + '?blockNumber=' + snapshot;
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
}
