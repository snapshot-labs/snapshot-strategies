import fetch from 'cross-fetch';

export const author = 'te-academy';
export const version = '0.0.1';

const VOTING_WEIGHT_API_URL = "https://tokenengineering.net/api/voting-weight"

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockNumber = typeof snapshot === 'number' ? snapshot : null;
  const response = await fetch(
    VOTING_WEIGHT_API_URL,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        addresses,
        blockNumber
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch voting weights: ${response.statusText}`);
  }


  const votingWeights = await response.json();

  return votingWeights;
}
