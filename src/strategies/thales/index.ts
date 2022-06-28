import { getAddress } from '@ethersproject/address';
import { formatUnits } from '@ethersproject/units';
import { subgraphRequest } from '../../utils';

export const author = 'vpoklopic';
export const version = '1.0.1';

const THALES_SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/thales-markets/thales-optimism';

export async function strategy(
  _space,
  _network,
  _provider,
  addresses,
  options,
  snapshot
) {
  const params = {
    stakers: {
      __args: {
        first: 1000,
        orderBy: 'totalStakedAmount',
        orderDirection: 'desc',
        where: {
          totalStakedAmount_gt: 0,
          id_in: addresses.map((addr: string) => addr.toLowerCase())
        }
      },
      id: true,
      timestamp: true,
      totalStakedAmount: true
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    params.stakers.__args.block = { number: snapshot };
  }

  const score = {};
  const result = await subgraphRequest(THALES_SUBGRAPH_URL, params);
  if (result && result.stakers) {
    result.stakers.forEach((staker) => {
      score[getAddress(staker.id)] = parseFloat(
        formatUnits(staker.totalStakedAmount, options.decimals)
      );
    });
  }

  return score || {};
}
