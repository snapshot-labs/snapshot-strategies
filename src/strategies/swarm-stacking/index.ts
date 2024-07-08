import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { subgraphRequest } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = 'swarm';
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
  const query = {
    swarmStakes: {
      __args: {
        first: 1000,
        where: {
          maker_in: addresses,
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

  const stakesByMaker = allStakes.reduce<Map<string, SwarmStake[]>>(
    (acc, stake) => {
      const makerStakes = acc.get(stake.maker) || [];
      makerStakes.push(stake);
      acc.set(stake.maker, makerStakes);
      return acc;
    },
    new Map()
  );

  const makersTokenAmount: Map<string, number> = new Map();
  stakesByMaker.forEach((stakes, maker) => {
    const bigTotalAmount: BigNumber = stakes.reduce(
      (acc, stake) => acc.add(BigNumber.from(stake.stakedAmount)),
      BigNumber.from(0)
    );
    const totalAmount = parseFloat(
      formatUnits(bigTotalAmount, SMT_TOKEN_DECIMALS)
    );
    makersTokenAmount.set(maker, totalAmount);
  });

  const results = Object.fromEntries(
    [...makersTokenAmount.entries()].map(([maker, amount]) => {
      return [getAddress(maker), amount]; // checksum all addresses
    })
  );
  return results;
}
