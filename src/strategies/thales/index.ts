import { getAddress } from '@ethersproject/address';
import { formatUnits } from '@ethersproject/units';
import { getSnapshots, subgraphRequest } from '../../utils';

export const author = 'vpoklopic';
export const version = '1.0.4';

enum NetworkId {
  Optimism = 10,
  Arbitrum = 42161,
  Base = 8453
}

const THALES_SUBGRAPH_URL = {
  optimism:
    'https://api.thegraph.com/subgraphs/name/thales-markets/thales-token',
  arbitrum:
    'https://api.thegraph.com/subgraphs/name/thales-markets/thales-token-arbitrum',
  base: 'https://api.studio.thegraph.com/query/11948/thales-token-base/version/latest'
};

function returnGraphParams(addresses: string[], block: string | number) {
  const graphParams = {
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

  if (block !== 'latest') {
    // @ts-ignore
    graphParams.stakers.__args.block = {
      number: block
    };
  }

  return graphParams;
}

export async function strategy(
  _space,
  _network,
  _provider,
  addresses,
  options,
  snapshot
) {
  const blocks = await getSnapshots(_network, snapshot, _provider, [
    NetworkId.Optimism,
    NetworkId.Arbitrum,
    NetworkId.Base
  ]);

  const optimismGraphParams = returnGraphParams(
    addresses,
    blocks[NetworkId.Optimism]
  );
  const arbitrumGraphParams = returnGraphParams(
    addresses,
    blocks[NetworkId.Arbitrum]
  );
  const baseGraphParams = returnGraphParams(addresses, blocks[NetworkId.Base]);

  const score = {};

  const [optimismStakers, arbitrumStakers, baseStakers] = await Promise.all([
    subgraphRequest(THALES_SUBGRAPH_URL.optimism, optimismGraphParams),
    subgraphRequest(THALES_SUBGRAPH_URL.arbitrum, arbitrumGraphParams),
    subgraphRequest(THALES_SUBGRAPH_URL.base, baseGraphParams)
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

  // If the Optimism or Arbitrum staker is also staker on Base, add an amount
  // Otherwise, just set Base staked amount as a score
  if (baseStakers && baseStakers.stakers) {
    baseStakers.stakers.forEach((staker) => {
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
