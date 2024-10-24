import { customFetch } from '../../utils';

export const author = '0xsarvesh';
export const version = '0.0.2';

const MOXIE_ENDPOINT = 'https://api.moxie.xyz/protocol/address-votes';
const MOXIE_API_KEY = process.env.MOXIE_API_KEY || '';

const buildURL = (addresses, snapshot) => {
  const addressesParam = addresses.join(',');
  const snapshotParam = snapshot ? `&block=${snapshot}` : '&block=latest';
  return `${MOXIE_ENDPOINT}?addresses=${addressesParam}${snapshotParam}`;
};

//Strategy to Compute Voting Power for MoxieDAO
export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const response = await customFetch(buildURL(addresses, snapshot), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-airstack-protocol': MOXIE_API_KEY
    }
  });

  const votes = await response.json();

  return votes.scores;
}
