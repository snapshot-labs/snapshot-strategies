import { subgraphRequest } from '../../utils';
import { getAddress } from '@ethersproject/address';

const ENS_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/ensdomains/ens',
  '3': 'https://api.thegraph.com/subgraphs/name/ensdomains/ensropsten',
  '4': 'https://api.thegraph.com/subgraphs/name/ensdomains/ensrinkeby',
  '5': 'https://api.thegraph.com/subgraphs/name/ensdomains/ensgoerli'
};

// 999 Club: 000-999 as strings, 1000 total
const NAMES_999_CLUB = [...Array(1000).keys()]
  .map((i) => -1 + i + 1)
  .map((x) => x.toString().padStart(3, '0'));

// 10K Club: 0000-9999 as strings, 10000 total
const NAMES_10K_CLUB = [...Array(10000).keys()]
  .map((i) => -1 + i + 1)
  .map((x) => x.toString().padStart(4, '0'));

export const author = 'paste';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const { clubWeight10k, clubWeight999 } = options;
  const max = 10;
  const count = Math.ceil(addresses.length / max);
  const pages = Array.from(Array(count)).map((x, i) =>
    addresses.slice(max * i, max * (i + 1))
  );
  const params = Object.fromEntries(
    pages
      .map((page, i) => `_${i}`)
      .map((q, i) => [
        q,
        {
          __aliasFor: 'registrations',
          __args: {
            block: snapshot !== 'latest' ? { number: snapshot } : null,
            where: {
              registrant_in: pages[i].map((address) => address.toLowerCase())
            },
            first: 1000,
            orderBy: 'registrationDate',
            orderDirection: 'desc'
          },
          registrant: {
            id: true
          },
          domain: {
            // labelhash: true,
            labelName: true
          }
        }
      ])
  );

  let result = await subgraphRequest(ENS_SUBGRAPH_URL[network], params);
  result = [].concat.apply([], Object.values(result));
  const votes = {};
  if (result) {
    result.forEach((registration) => {
      const owner = getAddress(registration.registrant.id);
      const label = registration.domain.labelName;
      if (!votes[owner]) {
        votes[owner] = 0;
      }
      if (NAMES_999_CLUB.includes(label)) {
        votes[owner] = votes[owner] + clubWeight999;
      } else if (NAMES_10K_CLUB.includes(label)) {
        votes[owner] = votes[owner] + clubWeight10k;
      }
    });
  }
  return votes;
}
