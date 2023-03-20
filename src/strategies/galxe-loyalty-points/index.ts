import fetch from 'cross-fetch';

export const author = 'HaynarCool';
export const version = '0.1.0';

const graphqlUrl = 'https://graphigo.stg.galaxy.eco/query';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const graphqlParams = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      operationName: 'galxeLoyaltyPoints',
      query: `query galxeLoyaltyPoints($spaceId: Int! $addresses: [String!]!) {
        space(id: $spaceId) {
          addressesLoyaltyPoints(addresses: $addresses) {
            address
            space
            points
          }
        }
      }`,
      variables: {
        spaceId: options.spaceId,
        addresses: addresses
      }
    })
  };
  const graphqlData = await fetch(graphqlUrl, graphqlParams)
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
