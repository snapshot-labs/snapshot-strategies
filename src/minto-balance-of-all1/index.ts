import fetch from 'cross-fetch';

export const author = 'btcmt-minto';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const MINTO_VOTE_API_URL = options.mintoVoteUrl;

  const response = await fetch(MINTO_VOTE_API_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      addresses: addresses
    })
  });
  const data = await response.json();

  return Object.fromEntries(
    addresses.map((address) => {
      return [address, data[address]];
    })
  );
}
