import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

const SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/wagdie/wagdieworld-mainnet'
};

export const author = 'IcculusHerEmissary';
export const version = '0.1.0';

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
  for (const address of addresses) {
    scores[getAddress(address)] = 0;
  }

  // If graph doesn't exist return
  if (!SUBGRAPH_URL[network]) {
    return scores;
  }

  const params = {
    characters: {
      __args: {
        where: {
          owner_in: addresses.map((address) => address.toLowerCase()),
          id_gt: '',
          burned: false
        },
        orderBy: 'id',
        orderDirection: 'asc',
        first: 1000
      },
      id: true,
      owner: {
        id: true
      },
      location: {
        id: true
      }
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    params.characters.__args.block = { number: snapshot };
  }

  let hasNext = true;
  while (hasNext) {
    const result = await subgraphRequest(SUBGRAPH_URL[network], params);

    const characters = result && result.characters ? result.characters : [];
    const latest = characters[characters.length - 1];
    console.log(options.location);

    for (const character of characters) {
      const userAddress = getAddress(character.owner.id);
      const charId = character?.location?.id;
      if (
        options.location.includes('all') ||
        options.location.includes(charId)
      ) {
        scores[userAddress] =
          (scores[userAddress] ?? 0) + options.scoreMultiplier;
      }
    }

    hasNext = characters.length === params.characters.__args.first;
    params.characters.__args.where.id_gt = latest ? latest.id : '';
  }

  return scores || {};
}
