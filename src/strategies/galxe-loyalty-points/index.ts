import { error } from 'console';
import { customFetch } from '../../utils';

export const author = 'HaynarCool';
export const version = '0.1.0';

const graphqlUrl = 'https://graphigo.prd.galaxy.eco/query';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const url = new URL(options.space_url);
  const parts = url.pathname.split('/');
  if (parts.length < 2) {
    throw error('invalid galxe space url');
  }
  const graphqlParams = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      operationName: 'galxeLoyaltyPoints',
      query: `query galxeLoyaltyPoints($alias: String! $addresses: [String!]! $snapshotId: String!) {
        space(alias: $alias) {
          addressesLoyaltyPoints(addresses: $addresses, snapshotId: $snapshotId) {
            address
            space
            points
          }
        }
      }`,
      variables: {
        alias: parts[1],
        addresses: addresses,
        snapshotId: options.snapshot_id
          ? options.snapshot_id
          : typeof snapshot === 'number'
          ? snapshot
          : ''
      }
    })
  };
  const graphqlData = await customFetch(graphqlUrl, graphqlParams)
    .then((r) => r.json())
    .catch((e) => {
      console.error('query galxe user loyalty points failed');
      throw e;
    });
  const scores = {};
  graphqlData.data.space.addressesLoyaltyPoints.forEach((item) => {
    scores[item.address] = item.points;
  });
  return scores;
}
