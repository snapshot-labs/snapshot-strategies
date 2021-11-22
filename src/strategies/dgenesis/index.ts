import { getAddress } from '@ethersproject/address';
import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { subgraphRequest } from '../../utils';

const DGENESIS_SUBGRAPH_URL = {
  '42161': 'https://api.thegraph.com/subgraphs/name/callikai/dgenesisarbitrum'
};

export const author = 'callikai';
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
    tokenUsers: {
      __args: {
        where: {
          id_in: addresses.map((address) => address.toLowerCase())
        },
        first: 1000
      },
      id: true,
      totalBalance: true
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    params.tokenUsers.__args.block = { number: snapshot };
  }
  const result = await subgraphRequest(DGENESIS_SUBGRAPH_URL[network], params);

  const score = {};

  if (result && result.tokenUsers) {
    result.tokenUsers.map((_data) => {
      const address = getAddress(_data.id);
      score[address] = Number(
        formatUnits(BigNumber.from(_data.totalBalance), 18)
      );
    });
  }

  return score || {};
}
