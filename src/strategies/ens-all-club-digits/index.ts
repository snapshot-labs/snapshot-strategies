import { subgraphRequest } from '../../utils';
import { getAddress } from '@ethersproject/address';

const ENS_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/ensdomains/ens',
  '3': 'https://api.thegraph.com/subgraphs/name/ensdomains/ensropsten',
  '4': 'https://api.thegraph.com/subgraphs/name/ensdomains/ensrinkeby',
  '5': 'https://api.thegraph.com/subgraphs/name/ensdomains/ensgoerli'
};

export const author = 'onigiri-x';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  // 999 Club = 3 , 10k club = 4, 100k club = 5, etc
  const { numberOfDigits } = options;

  const max = 10;
  const count = Math.ceil(addresses.length / max);
  const pages = Array.from(Array(count)).map((x, i) =>
    addresses.slice(max * i, max * (i + 1))
  );
  let page = 0;
  const votes = {};
  // This will iterate until there are no more full pages (1000 domains being returned),
  while (true) {
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
              skip: page * 1000,
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

    if (result) {
      result.forEach((registration) => {
        const owner = getAddress(registration.registrant.id);
        const label = registration.domain.labelName;
        if (!votes[owner]) {
          votes[owner] = 0;
        }
        const reg = new RegExp('^[0-9]*$'); // only number 0 to 9
        if (label && label.length === numberOfDigits && reg.test(label)) {
          votes[owner] = votes[owner] + 1;
        }
      });
      if (result.length >= 1000) {
        page++;
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return votes;
}
