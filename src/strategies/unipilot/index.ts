import { subgraphRequest } from '../../utils';
import {
  getAllReserves,
  getAllReservesTest,
  getInfo,
  getReservesTest
} from './helper';

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
          pool: '0xfc9f572124d8f469960b94537b493f2676776c03',
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
  const now = Date.now();

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
    return getAllReservesTest(user?.positions);
  });

  // console.log('user end', (Date.now() - now) / 1000);

  // const positionInfos = await Promise.all(
  //   usersUniswap.map((user: any) => {
  //     return getInfo(user?.positions, _provider);
  //   })
  // );

  // console.log('promise end', (Date.now() - now) / 1000);

  // const positionInfosPrepare: any = [];
  // positionInfos?.forEach((positionInfo: any, root_idx) => {
  //   positionInfosPrepare.push(
  //     positionInfo?.map((positions, idx) => {
  //       return {
  //         positions,
  //         tick: usersUniswap[root_idx]?.positions[idx]?.pool.tick,
  //         sqrtPrice: usersUniswap[root_idx]?.positions[idx]?.pool.sqrtPrice
  //       };
  //     })
  //   );
  // });

  // // console.log('positionInfosPrepare', positionInfosPrepare);

  // console.log('end position info', (Date.now() - now) / 1000);

  // const reserves = await Promise.all(
  //   positionInfosPrepare.map((positionInfo, idx) => {
  //     return getAllReserves(positionInfo);
  //   })
  // );

  // console.log('end reserve', (Date.now() - now) / 1000);

  // // console.log('reserves', reserves);

  const score = {};

  reserves?.forEach((user: any, idx) => {
    let token0Reserve = 0;
    let token1Reserve = 0;

    user.forEach((position: any) => {
      console.log(
        'position?.token0Reserve',
        position?.token0Reserve,
        position?.token1Reserve
      );
      token0Reserve += position?.token0Reserve;
      token1Reserve += position?.token1Reserve;
    });

    score[addresses[idx]] = token0Reserve;
  });

  // htao
  // addresses.forEach((address, idx) => {
  //   score[address] = reserves[idx].token0Reserve;
  // });

  return score || {};
}
