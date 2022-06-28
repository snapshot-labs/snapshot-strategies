import { subgraphRequest } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = 'cha0sg0d';
export const version = '0.1.0';

const calcScore = (score: number) => {
  return score == 0 ? 0 : Math.floor(Math.log2(score));
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const DF_SUBGRAPH_URL = options.graph_url;

  const params = {
    players: {
      __args: {
        where: {
          id_in: addresses.map((addr: string) => addr.toLowerCase())
        },
        first: 1000
      },
      id: true,
      score: true
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    params.players.__args.block = { number: snapshot };
  }

  const result = await subgraphRequest(DF_SUBGRAPH_URL, {
    ...params
  });

  return Object.fromEntries(
    result.players.map((p) => [getAddress(p.id), calcScore(parseInt(p.score))])
  );
}
