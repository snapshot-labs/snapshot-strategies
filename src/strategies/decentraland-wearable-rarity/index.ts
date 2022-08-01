import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

export const author = '2fd';
export const version = '0.1.0';

const DECENTRALAND_COLLECTIONS_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/decentraland/collections-ethereum-mainnet',
  '3': 'https://api.thegraph.com/subgraphs/name/decentraland/collections-ethereum-ropsten',
  '137':
    'https://api.thegraph.com/subgraphs/name/decentraland/collections-matic-mainnet',
  '80001':
    'https://api.thegraph.com/subgraphs/name/decentraland/collections-matic-mumbai'
};

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

  // if graph doesn't exists return automaticaly
  if (!DECENTRALAND_COLLECTIONS_SUBGRAPH_URL[network]) {
    return scores;
  }

  // initialize multiplers and params
  const multiplers = options.multipliers || {};
  const params = {
    nfts: {
      __args: {
        where: {
          itemType_in: [
            'wearable_v1',
            'wearable_v2',
            'smart_wearable_v1',
            'emote_v1'
          ],
          owner_in: addresses.map((address) => address.toLowerCase()),
          id_gt: ''
        },
        orderBy: 'id',
        orderDirection: 'asc',
        first: 1000
      },
      owner: {
        id: true
      },
      searchWearableRarity: true
    }
  };

  if (options.collections) {
    // @ts-ignore
    params.nfts.__args.where.collection_in = options.collections;
  }

  if (snapshot !== 'latest') {
    // @ts-ignore
    params.nfts.__args.block = { number: snapshot };
  }

  // load and add each wearable by rarity
  let hasNext = true;
  while (hasNext) {
    const result = await subgraphRequest(
      DECENTRALAND_COLLECTIONS_SUBGRAPH_URL[network],
      params
    );

    const nfts = result && result.nfts ? result.nfts : [];
    const latest = nfts[nfts.length - 1];
    for (const wearable of nfts) {
      const userAddress = getAddress(wearable.owner.id);
      const rarity = String(wearable.searchWearableRarity).toLowerCase().trim();
      scores[userAddress] =
        (scores[userAddress] ?? 0) + (multiplers[rarity] ?? 0);
    }

    hasNext = nfts.length === params.nfts.__args.first;
    params.nfts.__args.where.id_gt = latest ? latest.id : '';
  }

  // return result
  return scores;
}
