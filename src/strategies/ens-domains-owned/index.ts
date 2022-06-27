import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

const ENS_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/ensdomains/ens',
  '3': 'https://api.thegraph.com/subgraphs/name/ensdomains/ensropsten',
  '4': 'https://api.thegraph.com/subgraphs/name/ensdomains/ensrinkeby',
  '5': 'https://api.thegraph.com/subgraphs/name/ensdomains/ensgoerli'
};

export const author = 'makoto';
export const version = '0.1.0';

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
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
          __aliasFor: 'domains',
          __args: {
            block: snapshot !== 'latest' ? { number: snapshot } : undefined,
            where: {
              name: options.domain
            },
            first: 1000
          },
          id: true,
          labelName: true,
          subdomains: {
            __args: {
              where: {
                owner_in: pages[i].map((address) => address.toLowerCase())
              }
            },
            owner: {
              id: true
            }
          }
        }
      ])
  );

  let result = await subgraphRequest(ENS_SUBGRAPH_URL[network], params);
  result = [].concat.apply([], Object.values(result));

  const score = {};
  if (result) {
    result.forEach((u) => {
      u.subdomains.forEach((domain) => {
        const userAddress = getAddress(domain.owner.id);
        if (!score[userAddress]) score[userAddress] = 0;
        score[userAddress] = score[userAddress] + 1;
      });
    });
  }
  return score || {};
}
