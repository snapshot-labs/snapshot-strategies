import { customFetch } from '../../utils';

export const author = '0xsarvesh';
export const version = '0.0.2';

const MOXIE_ENDPOINT = 'https://api.moxie.xyz/protocol/address-votes';
const MOXIE_API_KEY = process.env.MOXIE_API_KEY || '';

//Strategy to Compute Voting Power for MoxieDAO
export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const response = await customFetch(
    MOXIE_ENDPOINT,
    {
      method: 'POST',
      body: JSON.stringify({
        block: snapshot,
        addresses
      }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-airstack-protocol': MOXIE_API_KEY
      }
    },
    60000
  );

  const votes = await response.json();

  return votes.scores;
}
