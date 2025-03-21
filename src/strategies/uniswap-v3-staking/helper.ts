import { FeeAmount, Pool, Position } from '@uniswap/v3-sdk';
import { Token } from '@uniswap/sdk-core';
import { Multicaller } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';

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

const V3_STAKER_ABI = [
  'function deposits(uint256 tokenId) external view returns ((address owner, uint48 numberOfStakes, int24 tickLower, int24 tickUpper))',
  'function getRewardInfo((address,address,uint256,uint256,address), uint256 tokenId) external view returns (uint256 reward, uint160 secondsInsideX128)'
];

// Canonical V3 staker contract across all networks
export const UNISWAP_V3_STAKER = '0x1f98407aaB862CdDeF78Ed252D6f557aA5b0f00d';

interface Stake {
  owner: string;
  reward: BigNumber;
}

export const getStakeInfo = async (
  blockTag: string | number,
  network,
  provider,
  options,
  tokenIDs: number[]
): Promise<Record<number, Stake>> => {
  const incentiveKey = [
    options.rewardToken,
    options.poolAddress,
    options.startTime,
    options.endTime,
    options.refundee
  ];

  // This helps us parallelize everything in one execution
  const multi = new Multicaller(network, provider, V3_STAKER_ABI, { blockTag });
  tokenIDs.forEach((tokenID) => {
    multi.call(`deposit-${tokenID}`, UNISWAP_V3_STAKER, 'deposits', [tokenID]);
    multi.call(`reward-${tokenID}`, UNISWAP_V3_STAKER, 'getRewardInfo', [
      incentiveKey,
      tokenID
    ]);
  });
  const results: Record<number, any> = await multi.execute();

  const keys = Object.keys(results);

  const depositResults: Record<number, { owner: string }> = Object.fromEntries(
    keys
      .filter((k) => k.includes('deposit'))
      .map((k) => {
        const tokenID = k.split('-')[1];
        return [tokenID, results[`deposit-${tokenID}`]];
      })
  );

  const rewardResults: Record<number, { reward: string }> = Object.fromEntries(
    keys
      .filter((k) => k.includes('reward'))
      .map((k) => {
        const tokenID = k.split('-')[1];
        return [tokenID, results[`reward-${tokenID}`]];
      })
  );

  return Object.fromEntries(
    Object.entries(depositResults).map(([tokenID, deposit]) => [
      tokenID,
      {
        owner: deposit.owner.toLowerCase(),
        reward: rewardResults[tokenID].reward
      }
    ])
  );
};
