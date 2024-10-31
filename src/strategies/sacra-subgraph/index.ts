import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

const SUBGRAPH_URL = {
  '250': 'https://graph.tetu.io/subgraphs/name/sacra-fantom',
  '111188': 'https://graph.tetu.io/subgraphs/name/sacra-real'
};

export const author = 'alexandersazonof';
export const version = '0.0.2';

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

  const queryOne = {
    heroEntities: {
      __args: {
        where: {
          owner_in: addresses.map((address) => address.toLowerCase()),
          dead: false,
          score_gt: 0
        },
        orderBy: 'score',
        orderDirection: 'desc',
        first: 1000
      },
      score: true,
      owner: {
        id: true
      }
    },
    itemEntities: {
      __args: {
        where: {
          user_in: addresses.map((address) => address.toLowerCase()),
          score_gt: 0
        },
        orderBy: 'score',
        orderDirection: 'desc',
        first: 1000
      },
      score: true,
      user: {
        id: true
      }
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    queryOne.heroEntities.__args.block = { number: snapshot };
    // @ts-ignore
    queryOne.itemEntities.__args.block = { number: snapshot };
  }

  const queryResultOne = await subgraphRequest(SUBGRAPH_URL[network], queryOne);

  if (queryResultOne) {
    const heroEntities = queryResultOne.heroEntities
      ? queryResultOne.heroEntities
      : [];
    for (const heroEntity of heroEntities) {
      const userAddress = getAddress(heroEntity.owner.id);
      const score = heroEntity.score;
      scores[userAddress] = (scores[userAddress] ?? 0) + score;
    }
    const itemEntities = queryResultOne.itemEntities
      ? queryResultOne.itemEntities
      : [];
    for (const itemEntity of itemEntities) {
      const userAddress = getAddress(itemEntity.user.id);
      const score = itemEntity.score;
      scores[userAddress] = (scores[userAddress] ?? 0) + score;
    }
  }

  return scores || {};
}
