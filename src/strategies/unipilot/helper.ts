import { call } from '../../utils';
import NFPABI from './NonfungiblePositionManager.json';

import { FeeAmount, Pool, Position } from '@uniswap/v3-sdk';
import { Fetcher } from '@uniswap/sdk';
import { Token } from '@uniswap/sdk-core';

const CONTRACT_ADDRESSES = {
  nonfungiblePositionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88'
};

export const getInfo = async (positions: any, _provider): Promise<any> => {
  try {
    const NFTpositions = await Promise.all(
      positions?.map((position, idx) => {
        const _call = [
          CONTRACT_ADDRESSES.nonfungiblePositionManager,
          'positions',
          [position?.id]
        ];
        return call(_provider, NFPABI, _call);
      })
    );
    const prepare = NFTpositions.map((position, idx) => {
      return {
        positions: position,
        tick: positions[idx]?.pool.tick,
        sqrtPrice: positions[idx]?.pool.sqrtPrice
      };
    });
    return prepare;
  } catch (e) {
    return [];
  }
};

export const formatToken = async (_token: string) => {
  const token = await Fetcher.fetchTokenData(1, _token);
  return new Token(1, token.address, Number(token.decimals), token.symbol);
};

export const getAllReserves = async (positionInfo: any) => {
  let token0Reserve = 0,
    token1Reserve = 0;
  let results = await Promise.all(
    positionInfo?.map(async (info: any) => {
      const { positions, tick, sqrtPrice } = info;
      return getReserves(
        positions.token0,
        positions.token1,
        positions.fee,
        positions.liquidity,
        positions.tickUpper,
        positions.tickLower,
        tick,
        sqrtPrice
      );
    })
  );

  results.forEach((result: any, idx) => {
    token0Reserve += result?.token0Reserve;
    token1Reserve += result?.token1Reserve;
  });

  return {
    token0Reserve,
    token1Reserve
  };
};

export const getFeeAmount = (fee: string): FeeAmount | undefined => {
  const feeAmount: FeeAmount | undefined = Object.values(FeeAmount).includes(
    parseFloat(fee)
  )
    ? parseFloat(fee)
    : undefined;
  return feeAmount;
};

export const getReserves = async (
  baseToken: string,
  quoteToken: string,
  feeTier: string,
  liquidity: string,
  tickUpper: string,
  tickLower: string,
  currentTick: string,
  sqrtPrice: string
) => {
  const _baseToken = await formatToken(baseToken);
  const _quoteToken = await formatToken(quoteToken);

  if (
    parseInt(currentTick) < parseInt(tickLower) ||
    parseInt(currentTick) > parseInt(tickUpper)
  ) {
    return {
      token0Reserve: 0,
      token1Reserve: 0,
      poolTick: 0,
      position: undefined,
      inRange: false
    };
  }

  let _fee = getFeeAmount(feeTier) ?? 0;

  const pool = new Pool(
    _baseToken,
    _quoteToken,
    _fee,
    sqrtPrice,
    liquidity,
    Number(currentTick)
  );

  if (pool) {
    const position = new Position({
      pool,
      liquidity,
      tickLower: Number(tickLower),
      tickUpper: Number(tickUpper)
    });
    return {
      token0Reserve: parseFloat(position.amount0.toSignificant(4)),
      token1Reserve: parseFloat(position.amount1.toSignificant(4)),
      poolTick: currentTick,
      position,
      inRange: true
    };
  } else {
    return {
      token0Reserve: 0,
      token1Reserve: 0,
      poolTick: 0,
      position: undefined,
      inRange: false
    };
  }
};
