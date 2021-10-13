import { subgraphRequest } from '../../utils';
import { getAllReserves, getOwnerOfStakes, UNISWAP_V3_STAKER } from './helper';

const UNISWAP_V3_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3'
};

export const author = 'ribbon-finance';
export const version = '0.1.0';

export async function strategy(
  _space,
  network,
  _provider,
  addresses,
  options,
  snapshot
) {
  const tokenReserve =
    options.tokenReserve === 0 ? 'token0Reserve' : 'token1Reserve';

  const _addresses = addresses.map((address) => address.toLowerCase());

  const params = {
    positions: {
      __args: {
        where: {
          pool: options.poolAddress.toLowerCase(),
          owner: UNISWAP_V3_STAKER.toLowerCase()
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

  const positions = rawData.positions;
  const tokenIDs = positions.map((pos) => parseInt(pos.id));
  const tokenIDToOwner = await getOwnerOfStakes(
    snapshot,
    network,
    _provider,
    options,
    tokenIDs
  );

  const reserves = getAllReserves(positions)
  const score = {};

  reserves?.forEach((position: any, idx) => {
    const user = tokenIDToOwner[positions[idx].id];
    if (_addresses.includes(user)) {
      if (!score[user]) {
        score[user] = position[tokenReserve];
      } else {
        score[user] += position[tokenReserve];
      }
    }
  });

  return score || {};
}
