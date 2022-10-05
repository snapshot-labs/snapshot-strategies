import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

const SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/wagdie/wagdieworld-mainnet'
};

export const author = 'icculus';
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
    accounts: {
      __args: {
        where: {
          id_in: addresses.map((address) => address.toLowerCase()),
          ownedWAGDIE_gt: 0
        }
      },
      id: true,
      ownedWAGDIE: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.accounts.__args.block = { number: snapshot };
  }
  const result = await subgraphRequest(
    options.subGraphURL ? options.subGraphURL : SUBGRAPH_URL[network],
    params
  );
  const score = {};
  if (result && result.accounts) {
    result.accounts.forEach((account) => {
      const accountAddress = getAddress(account.id);
      let accountscore = Number(account.ownedWAGDIE);

      if (options.scoreMultiplier) {
        accountscore = accountscore * options.scoreMultiplier;
      }
      if (!score[accountAddress]) score[accountAddress] = 0;
      score[accountAddress] = score[accountAddress] + accountscore;
    });
  }
  return score || {};
}
