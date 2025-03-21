import { FeeAmount, Pool, Position } from '@uniswap/v3-sdk';
import { Token } from '@uniswap/sdk-core';

export const getFeeAmount = (fee: string): FeeAmount | undefined => {
  const feeAmount: FeeAmount | undefined = Object.values(FeeAmount).includes(
    parseFloat(fee)
  )
    ? parseFloat(fee)
    : undefined;
  return feeAmount;
};

export const getAllReserves = (positionInfo: any) => {
  return positionInfo?.map((info: any) => {
    return getReserves(info);
  });
};

export const getReserves = ({
  tickLower,
  tickUpper,
  liquidity,
  pool: { tick, sqrtPrice, feeTier },
  token0,
  token1
}: any) => {
  const [_baseToken, _quoteToken] = [
    new Token(1, token0.id, Number(token0.decimals), token0.symbol),
    new Token(1, token1.id, Number(token1.decimals), token1.symbol)
  ];
  if (
    parseInt(tick) < parseInt(tickLower.tickIdx) ||
    parseInt(tick) > parseInt(tickUpper.tickIdx)
  ) {
    return {
      token0Reserve: 0,
      token1Reserve: 0,
      poolTick: 0,
      position: undefined,
      inRange: false
    };
  }

  const _fee = getFeeAmount(feeTier) ?? 0;
  const pool = new Pool(
    _baseToken,
    _quoteToken,
    _fee,
    sqrtPrice,
    liquidity,
    Number(tick)
  );

  if (pool) {
    const position = new Position({
      pool,
      liquidity,
      tickLower: Number(tickLower.tickIdx),
      tickUpper: Number(tickUpper.tickIdx)
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
