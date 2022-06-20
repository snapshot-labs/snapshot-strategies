import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

export const author = 'andreibadea20';
export const version = '0.1.0';

const DPS_SUBGRAPH_URL = {
  '80001': 'https://api.thegraph.com/subgraphs/name/andreibadea20/subgraph-dps'
};

export async function strategy(
  space,
  network,
  provider,
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
      numberOfTokens: true
      }
  };

  const result = await subgraphRequest(DPS_SUBGRAPH_URL[network], params);
  const score = {};

  if (result && result.users) {
    result.users.forEach((u) => {
      const userScore = parseInt(u.numberOfTokens);
      const userAddress = getAddress(u.id);
      
      if (!score[userAddress]) 
        score[userAddress] = 0;

      score[userAddress] = userScore;
    });
  }

  return score;
}
