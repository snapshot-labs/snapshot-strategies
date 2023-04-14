import { getAddress } from '@ethersproject/address';
import { formatUnits } from '@ethersproject/units';
import { subgraphRequest } from '../../utils';

export const author = 'vpoklopic';
export const version = '1.0.3';

const THALES_SUBGRAPH_URL = {
  optimism:
    'https://api.thegraph.com/subgraphs/name/thales-markets/thales-token',
  arbitrum:
    'https://api.thegraph.com/subgraphs/name/thales-markets/thales-token-arbitrum'
};

function returnGraphParams(addresses: string[]) {
  return {
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
}

export async function strategy(
  _space,
  _network,
  _provider,
  addresses,
  options
) {
  const optimismGraphParams = returnGraphParams(addresses);
  if (options.blockOptimism !== undefined) {
    // @ts-ignore
    optimismGraphParams.stakers.__args.block = {
      number: options.blockOptimism
    };
  }

  const arbitrumGraphParams = returnGraphParams(addresses);
  if (options.blockArbitrum !== undefined) {
    // @ts-ignore
    arbitrumGraphParams.stakers.__args.block = {
      number: options.blockArbitrum
    };
  }

  const score = {};

  const [optimismStakers, arbitrumStakers] = await Promise.all([
    subgraphRequest(THALES_SUBGRAPH_URL.optimism, optimismGraphParams),
    subgraphRequest(THALES_SUBGRAPH_URL.arbitrum, arbitrumGraphParams)
  ]);

  // We are starting by mapping all Optimism stakers
  if (optimismStakers && optimismStakers.stakers) {
    optimismStakers.stakers.forEach((staker) => {
      score[getAddress(staker.id)] = parseFloat(
        formatUnits(staker.totalStakedAmount, options.decimals)
      );
    });
  }

  // If the Optimism staker is also staker on Arbitrum, add an amount
  // Otherwise, just set Arbitrum staked amount as a score
  if (arbitrumStakers && arbitrumStakers.stakers) {
    arbitrumStakers.stakers.forEach((staker) => {
      const key = getAddress(staker.id);
      const stakedAmount = parseFloat(
        formatUnits(staker.totalStakedAmount, options.decimals)
      );
      if (!!score[key]) {
        score[key] += stakedAmount;
      } else {
        score[key] = stakedAmount;
      }
    });
  }

  return score || {};
}
