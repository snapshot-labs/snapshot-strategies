import { getAddress } from '@ethersproject/address';
import { multicall, subgraphRequest } from '../../utils';
import { getAllReserves } from './helper';

export const author = 'rafaqat11';
export const version = '0.1.0';

const liquidity = {
  inputs: [],
  name: 'liquidity',
  outputs: [{ internalType: 'uint128', name: '', type: 'uint128' }],
  stateMutability: 'view',
  type: 'function'
};
const globalState = {
  inputs: [],
  name: 'globalState',
  outputs: [
    { internalType: 'uint160', name: 'price', type: 'uint160' },
    { internalType: 'int24', name: 'tick', type: 'int24' },
    { internalType: 'uint16', name: 'fee', type: 'uint16' },
    { internalType: 'uint16', name: 'timepointIndex', type: 'uint16' },
    { internalType: 'uint8', name: 'communityFeeToken0', type: 'uint8' },
    { internalType: 'uint8', name: 'communityFeeToken1', type: 'uint8' },
    { internalType: 'bool', name: 'unlocked', type: 'bool' }
  ],
  stateMutability: 'view',
  type: 'function'
};

const poolABI = [globalState, liquidity];

const params = {
  positions: {
    __args: {
      where: {
        pool: '',
        from_in: []
      }
    },
    id: true,
    from: true,
    lowerTick: true,
    upperTick: true,
    liquidity: true
  }
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const key = options.isToken0 ? 'token0Reserve' : 'token1Reserve';

  const poolAddress = options.poolAddress.toLowerCase();
  const _addresses = addresses.map((address) => address.toLowerCase());

  params.positions.__args.where.pool = poolAddress;
  params.positions.__args.where.from_in = _addresses;

  const { positions } = (await subgraphRequest(options.subgraph, params)) as {
    positions: {
      id: string;
      from: string;
      lowerTick: number;
      upperTick: number;
      liquidity: string;
    }[];
  };

  const res = await multicall(
    network,
    provider,
    poolABI,
    [
      [poolAddress, globalState.name, []],
      [poolAddress, liquidity.name, []]
    ],
    { blockTag }
  );

  const tick = res[0]?.tick?.toString();
  const price = res[0]?.price?.toString();
  const poolLiquidity = res[1]?.toString();
  console.log('network', network);

  const reserves = getAllReserves(
    positions.map((pos) => ({
      network: Number(network),
      liquidity: poolLiquidity,
      posLiquidity: pos.liquidity,
      price,
      tick,
      token0: options.token0,
      token1: options.token1,
      tickLower: pos.lowerTick,
      tickUpper: pos.upperTick
    }))
  );

  const ret = {};

  positions.forEach((pos, idx) => {
    ret[getAddress(pos.from)] = reserves[idx][key];
  });

  return ret;
}
