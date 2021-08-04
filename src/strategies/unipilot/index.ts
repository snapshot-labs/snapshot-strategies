import { subgraphRequest } from '../../utils';
import { getAllReserves, getInfo } from './helper';

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
      pool: {
        tick: true,
        sqrtPrice: true
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

  const positionInfos = await Promise.all(
    usersUniswap.map((user: any) => {
      return getInfo(user?.positions, _provider);
    })
  );

  const reserves = await Promise.all(
    positionInfos.map((positionInfo, idx) => {
      return getAllReserves(positionInfo);
    })
  );

  const score = {};
  addresses.forEach((address, idx) => {
    score[address] = reserves[idx].token0Reserve;
  });

  return score || {};
}
