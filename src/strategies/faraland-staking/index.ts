import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

const FLASHSTAKE_SUBGRAPH_URL = {
  '1': 'https://queries-graphnode.faraland.io/subgraphs/name/edwardevans094/farastore-v12',
  '56': 'https://queries-graphnode.faraland.io/subgraphs/name/edwardevans094/farastore-v12'
};

export const author = 'edwardEvans094';
export const version = '0.1.0';

export async function strategy(
  _space,
  network,
  _provider,
  addresses,
  options,
  snapshot
) {
  const params = {
    users: {
      __args: {
        where: {
          id_in: addresses.map((address) => address.toLowerCase())
        },
        first: 1000
      },
      id: true,
      totalStaked: true
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    params.users.__args.block = { number: snapshot };
  }
  const result = await subgraphRequest(
    FLASHSTAKE_SUBGRAPH_URL[network],
    params
  );

  const score = {};
  if (result && result.users) {
    result.users.map((_data) => {
      const address = getAddress(_data.id);
      score[address] = Number(_data.totalStaked);
    });
  }

  return score || {};
}
