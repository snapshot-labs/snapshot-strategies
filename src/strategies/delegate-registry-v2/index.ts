import fetch from 'cross-fetch';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Strategy } from '@snapshot-labs/snapshot.js/dist/voting/types';

export const author = 'gnosis';
export const version = '0.0.1';

const DEFAULT_BACKEND_URL = 'https://delegate-registry-backend.vercel.app';

type Params = {
  backendUrl: string;
  strategies: Strategy[];
};

/*
  This strategy:
  - returns a score of 0 for addresses that are delegating to other addresses (PS: addresses that returns a score of 0, should not be allowed to vote),
  - returns a score greater than 0, for addresses that are delegated to (PS: only the amount delegated to the address us returned, this needs to be merged with the scores from other strategies in the space),
  - returns nothing for addresses that are not delegating to other addresses or delegated to.
*/
export async function strategy(
  space: string,
  network: string,
  provider: StaticJsonRpcProvider,
  addresses: string[],
  options: Params = { backendUrl: DEFAULT_BACKEND_URL, strategies: [] },
  snapshot: string | number
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const response = await fetch(
    `${options.backendUrl}/api/${space}/snapshot/${blockTag}/strategy-formatted-vote-weights`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        addresses: addresses,
        strategies: options.strategies
      })
    }
  );

  // TODO:
  // If an address that is sent is not present in the response, we must get the score for that address by adding its score from all the `options.strategies`.
  // Addresses returning 0 should return a 0 score.
  // A positive number returned should be merged with its scores for the options.strategies (the returned score is only what is delegated to the address, not the total score for the address)

  return response.json();
}
