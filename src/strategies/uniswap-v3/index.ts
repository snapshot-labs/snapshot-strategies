import { subgraphRequest } from '../../utils';
import { getAllReserves } from './helper';

const UNISWAP_V3_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3'
};

export const author = 'anassohail99';
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
    positions: {
      __args: {
        where: {
          pool: options.poolAddress,
          owner_in: addresses.map((address) => address.toLowerCase())
        }
      },
      id: true,
      owner: true,
      liquidity: true,
      tickLower: {
        tickIdx: true
      },
      tickUpper: {
        tickIdx: true
      },
      pool: {
        tick: true,
        sqrtPrice: true,
        liquidity: true,
        feeTier: true
      },
      token0: {
        symbol: true,
        decimals: true,
        id: true
      },
      token1: {
        symbol: true,
        decimals: true,
        id: true
      }
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    params.positions.__args.block = { number: snapshot };
  }

  const rawData = await subgraphRequest(
    UNISWAP_V3_SUBGRAPH_URL[network],
    params
  );

  const usersUniswap = addresses.map(() => ({
    positions: []
  }));

  rawData?.positions?.map((position, idx) => {
    usersUniswap[addresses.indexOf(position?.owner)].positions.push(position);
  });

  const reserves = usersUniswap.map((user, idx) => {
    return getAllReserves(user?.positions);
  });

  const score = {};

  reserves?.forEach((user: any, idx) => {
    let token0Reserve = 0;

    user.forEach((position: any) => {
      token0Reserve += position?.token0Reserve;
    });

    score[addresses[idx]] = token0Reserve;
  });

  return score || {};
}
