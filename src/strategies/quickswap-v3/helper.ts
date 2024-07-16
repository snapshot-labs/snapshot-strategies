import { FeeAmount, Pool, Position } from '@uniswap/v3-sdk';
import { Token } from '@uniswap/sdk-core';

type IReserves = {
  network: number;
  tickLower: number;
  tickUpper: number;
  liquidity: string;
  posLiquidity: string;
  tick: number;
  price: string;
  token0: {
    id: string;
    symbol: string;
    decimals: number;
  };
  token1: {
    id: string;
    symbol: string;
    decimals: number;
  };
};

export const getFeeAmount = (): FeeAmount => FeeAmount.LOW;

export const getAllReserves = (positionInfo: IReserves[]) => {
  return positionInfo?.map((info) => {
    return getReserves(info);
  });
};

export const getReserves = ({
  tickLower,
  tickUpper,
  liquidity,
  posLiquidity,
  tick,
  price,
  token0,
  token1,
  network
}: IReserves) => {
  const [_baseToken, _quoteToken] = [
    new Token(network, token0.id, Number(token0.decimals), token0.symbol),
    new Token(network, token1.id, Number(token1.decimals), token1.symbol)
  ];
  if (Number(tick) < Number(tickLower) || Number(tick) > Number(tickUpper)) {
    return {
      token0Reserve: 0,
      token1Reserve: 0,
      poolTick: 0,
      position: undefined,
      inRange: false
    };
  }

  const _fee = getFeeAmount();
  const pool = new Pool(
    _baseToken,
    _quoteToken,
    _fee,
    price,
    liquidity,
    Number(tick)
  );

  if (pool) {
    const position = new Position({
      pool,
      liquidity: posLiquidity,
      tickLower: Number(tickLower),
      tickUpper: Number(tickUpper)
    });
    return {
      token0Reserve: parseFloat(position.amount0.toSignificant(4)),
      token1Reserve: parseFloat(position.amount1.toSignificant(4)),
      poolTick: tick,
      position,
      inRange: true
    };
  }
  return {
    token0Reserve: 0,
    token1Reserve: 0,
    poolTick: 0,
    position: undefined,
    inRange: false
  };
};
