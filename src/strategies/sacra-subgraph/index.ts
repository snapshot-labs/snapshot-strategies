import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

const SUBGRAPH_URL = {
  '250': 'https://graph.tetu.io/subgraphs/name/sacra-fantom',
  '111188': 'https://graph.tetu.io/subgraphs/name/sacra-real'
};

export const author = 'alexandersazonof';
export const version = '0.0.1';

export async function strategy(
  _space,
  network,
  _provider,
  addresses,
  options,
  snapshot
) {
  // initialize scores
  const scores = {};

  // If graph doesn't exist return
  if (!SUBGRAPH_URL[network]) {
    return scores;
  }

  const params = {
    heroEntities: {
      __args: {
        where: {
          owner_in: addresses.map((address) => address.toLowerCase()),
          id_gt: '',
          dead: false
        },
        orderBy: 'id',
        orderDirection: 'asc',
        first: 1000
      },
      id: true,
      score: true,
      owner: {
        id: true
      }
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    params.heroEntities.__args.block = { number: snapshot };
  }

  let hasNext = true;
  while (hasNext) {
    const result = await subgraphRequest(SUBGRAPH_URL[network], params);

    const heroEntities =
      result && result.heroEntities ? result.heroEntities : [];
    const latest = heroEntities[heroEntities.length - 1];

    for (const heroEntity of heroEntities) {
      const userAddress = getAddress(heroEntity.owner.id);
      const score = heroEntity.score;
      scores[userAddress] = (scores[userAddress] ?? 0) + score;
    }

    hasNext = heroEntities.length === params.heroEntities.__args.first;
    params.heroEntities.__args.where.id_gt = latest ? latest.id : '';
  }

  return scores || {};
}
