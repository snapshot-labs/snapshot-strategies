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
  const power = {};

  // If graph doesn't exist return
  if (!SUBGRAPH_URL[network]) {
    return power;
  }

  const params = {
    heroActions: {
      __args: {
        where: {
          action: 3,
          id_gt: '',
          owner_in: addresses.map((address) => address.toLowerCase())
        },
        orderBy: 'id',
        orderDirection: 'asc',
        first: 1000
      },
      owner: {
        id: true
      },
      values: true
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    params.heroActions.__args.block = { number: snapshot };
  }

  let hasNext = true;
  while (hasNext) {
    const result = await subgraphRequest(SUBGRAPH_URL[network], params);

    const heroActions = result && result.heroActions ? result.heroActions : [];
    const latest = heroActions[heroActions.length - 1];

    for (const heroAction of heroActions) {
      const userAddress = getAddress(heroAction.owner.id);
      const userPower = 2 ** heroAction.values[0];
      power[userAddress] = (power[userAddress] ?? 0) + userPower;
    }

    hasNext = heroActions.length === params.heroActions.__args.first;
    params.heroActions.__args.where.id_gt = latest ? latest.id : '';
  }

  return power || {};
}
