import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { subgraphRequest } from '../../utils';
import { getAddress } from '@ethersproject/address';
import creatorToProxyMap from './creator-to-proxy-map';

export const author = 'SwarmMarkets';
export const version = '1.0.0';

// 137 - Polygon network number
const SUBGRAPH_URL = {
  137: 'https://gateway-arbitrum.network.thegraph.com/api/2e2730968289f9eb3287cd3f1991a957/deployments/id/QmbcvkW34SqmJLCaUB1GHkx61bFV7bSy2BHhzb3xuNTJhN'
};
const SMT_TOKEN_DECIMALS = 18;

interface SwarmStake {
  id: string;
  maker: string;
  stakedAmount: string;
}
async function getSwarmStakes(
  network: number | string,
  snapshot: number | string,
  addresses: string[]
): Promise<SwarmStake[]> {
  const url = SUBGRAPH_URL[network];
  // include proxy addresses if there are. so later we can assign it voting power to an actuall ownn
  const addressesWithProxy = [...addresses];
  addresses.forEach((address) => {
    if (creatorToProxyMap[address.toLowerCase()]) {
      addressesWithProxy.push(creatorToProxyMap[address.toLowerCase()]);
    }
  });
  const query = {
    swarmStakes: {
      __args: {
        first: 1000,
        where: {
          maker_in: addressesWithProxy,
          unstaked: false
        },
        // target specific snapshot of the network
        ...(typeof snapshot === 'number' && {
          block: {
            number: snapshot
          }
        })
      },
      id: true,
      maker: true,
      stakedAmount: true
    }
  };
  const res = await subgraphRequest(url, query);
  return res.swarmStakes;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const allStakes = await getSwarmStakes(network, snapshot, addresses);
  const bigScoreMap: Map<string, BigNumber> = new Map();
  const proxyToCreatorMap = Object.fromEntries(
    Object.entries(creatorToProxyMap).map(([key, value]) => [value, key])
  );
  allStakes.forEach(({ maker, stakedAmount }) => {
    // if stake address is a proxy contract, assign it's vote power to the owner address
    if (proxyToCreatorMap[maker]) {
      maker = proxyToCreatorMap[maker];
    }
    const currScore = bigScoreMap.get(maker) || BigNumber.from(0);
    bigScoreMap.set(maker, currScore.add(BigNumber.from(stakedAmount)));
  });
  // format results by checksuming addresses and parsing tokens amount
  const score = Object.fromEntries(
    [...bigScoreMap.entries()].map(([maker, amount]) => [
      getAddress(maker),
      parseFloat(formatUnits(amount, SMT_TOKEN_DECIMALS))
    ])
  );

  return score;
}
