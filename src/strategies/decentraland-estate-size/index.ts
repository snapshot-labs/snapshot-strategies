import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

export const author = '2fd';
export const version = '0.1.0';

const SUBGRAPH_QUERY_ADDRESSES_LIMIT = 2000;
const DECENTRALAND_MARKETPLACE_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/decentraland/marketplace',
  '3': 'https://api.thegraph.com/subgraphs/name/decentraland/marketplaceropsten'
};

function chunk(_array: string[], pageSize: number): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < _array.length; i += pageSize) {
    chunks.push(_array.slice(i, i + pageSize));
  }
  return chunks;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  // initialize scores
  const scores = {};
  for (const address of addresses) {
    scores[getAddress(address)] = 0;
  }

  // if graph doesn't exist return automatically
  if (!DECENTRALAND_MARKETPLACE_SUBGRAPH_URL[network]) {
    return scores;
  }

  const chunks = chunk(addresses, SUBGRAPH_QUERY_ADDRESSES_LIMIT);
  const multipler = options.multiplier || 1;

  for (const chunk of chunks) {
    const params = {
      nfts: {
        __args: {
          where: {
            owner_in: chunk.map((address) => address.toLowerCase()),
            category: 'estate',
            searchEstateSize_gt: 0
          },
          first: 1000,
          skip: 0
        },
        owner: {
          id: true
        },
        searchEstateSize: true
      }
    };

    if (snapshot !== 'latest') {
      // @ts-ignore
      params.nfts.__args.block = { number: snapshot };
    }

    let hasNext = true;
    while (hasNext) {
      const result = await subgraphRequest(
        DECENTRALAND_MARKETPLACE_SUBGRAPH_URL[network],
        params
      );

      const nfts = result && result.nfts ? result.nfts : [];
      for (const estate of nfts) {
        const userAddress = getAddress(estate.owner.id);
        scores[userAddress] =
          (scores[userAddress] || 0) + estate.searchEstateSize * multipler;
      }

      params.nfts.__args.skip += params.nfts.__args.first;
      hasNext = nfts.length === params.nfts.__args.first;
    }
  }

  return scores;
}
