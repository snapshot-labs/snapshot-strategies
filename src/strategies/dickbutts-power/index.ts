import fetch from 'cross-fetch';
import { getAddress } from '@ethersproject/address';

export const author = 'naomsa';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const responses = await Promise.all(
    addresses.map((address: string) =>
      fetch(
        `https://cryptodbs-api.herokuapp.com/votes/${address}?blockTag=${blockTag}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          }
        }
      )
    )
  );

  const scores: Record<string, number> = {};
  for (const [index, response] of responses.entries()) {
    const { votes }: { votes: number } = await response.json();
    const address = getAddress(addresses[index]);
    if (!scores[address]) scores[address] = 0;
    scores[address] += votes;
  }

  return Object.fromEntries(
    addresses.map((address) => [
      getAddress(address),
      scores[getAddress(address)] || 0
    ])
  );
}
