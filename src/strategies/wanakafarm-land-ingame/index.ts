import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

const FLASHSTAKE_SUBGRAPH_URL = {
  '1': 'https://score-api.wanakafarm.com/land-ingame/graphql',
  '56': 'https://score-api.wanakafarm.com/land-ingame/graphql'
};

export const author = 'TranTien139';
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
    balances: {
      __args: {},
      address: true,
      point: true
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    params.balances.__args.block = snapshot;
  }

  if (addresses && addresses?.length > 0) {
    // @ts-ignore
    params.balances.__args.addresses = addresses;
  }

  const result = await subgraphRequest(
    FLASHSTAKE_SUBGRAPH_URL[network],
    params
  );

  const score = {};
  if (result && result.balances) {
    result.balances.map((_data) => {
      const address = getAddress(_data.address);
      score[address] = Number(_data.point);
    });
  }
  return score || {};
}
