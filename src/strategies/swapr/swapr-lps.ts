import { Decimal } from 'decimal.js-light';
import { getAddress } from '@ethersproject/address';
import { mergeBalanceMaps, SWAPR_SUBGRAPH_URL } from './commons';
import { subgraphRequest } from '../../utils';

interface StandardLiquidityPosition {
  id: string;
  user: { id: string };
  liquidityTokenBalance: string;
  pair: {
    totalSupply: string;
    reserve0: string;
    reserve1: string;
  };
}

interface StakedLiquidityPosition {
  id: string;
  user: { id: string };
  stakedAmount: string;
  targetedPair: {
    totalSupply: string;
    reserve0: string;
    reserve1: string;
  };
}

const mergeStandardAndStakedPositions = (
  standardPositions: StandardLiquidityPosition[],
  stakedPositions: StakedLiquidityPosition[]
) => {
  return stakedPositions.reduce(
    (accumulator: StandardLiquidityPosition[], stakedPosition) => {
      const index = accumulator.findIndex(
        (p) => p.user.id.toLowerCase() === stakedPosition.user.id.toLowerCase()
      );
      if (index >= 0)
        accumulator[index].liquidityTokenBalance = new Decimal(
          accumulator[index].liquidityTokenBalance
        )
          .plus(stakedPosition.stakedAmount)
          .toString();
      else
        accumulator.push({
          ...stakedPosition,
          pair: stakedPosition.targetedPair,
          liquidityTokenBalance: stakedPosition.stakedAmount
        });
      return accumulator;
    },
    standardPositions
  );
};

const getPositions = async (
  network,
  addresses,
  options,
  snapshot
): Promise<{
  positionsByToken0: StandardLiquidityPosition[];
  positionsByToken1: StandardLiquidityPosition[];
}> => {
  const wantedTokenAddress = options.address;
  const swaprSubgraphUrl = SWAPR_SUBGRAPH_URL[network];

  const [token0Query, token1Query] = ['token0', 'token1'].map((key) => ({
    pairs: {
      __args: {
        where: {
          [key]: wantedTokenAddress.toLowerCase()
        },
        first: 1000
      },
      id: true
    }
  }));
  if (snapshot !== 'latest') {
    // @ts-ignore
    token0Query.pairs.__args.block = { number: snapshot };
    // @ts-ignore
    token1Query.pairs.__args.block = { number: snapshot };
  }
  const swprPairsByToken0 = await subgraphRequest(
    swaprSubgraphUrl,
    token0Query
  );
  const swprPairsByToken1 = await subgraphRequest(
    swaprSubgraphUrl,
    token1Query
  );

  const [liquidityPositionsByToken0Query, liquidityPositionsByToken1Query] = [
    swprPairsByToken0,
    swprPairsByToken1
  ].map((wrappedPairs) => ({
    liquidityPositions: {
      __args: {
        where: {
          user_in: addresses.map((address) => address.toLowerCase()),
          pair_in: wrappedPairs.pairs.map((pair) => pair.id),
          liquidityTokenBalance_gt: 0
        },
        first: 1000
      },
      user: {
        id: true
      },
      liquidityTokenBalance: true,
      pair: {
        totalSupply: true,
        reserve0: true,
        reserve1: true
      }
    }
  }));
  const liquidityPositionsByToken0 = await subgraphRequest(
    swaprSubgraphUrl,
    liquidityPositionsByToken0Query
  );
  const liquidityPositionsByToken1 = await subgraphRequest(
    swaprSubgraphUrl,
    liquidityPositionsByToken1Query
  );

  const [
    liquidityMiningPositionsByToken0Query,
    liquidityMiningPositionsByToken1Query
  ] = [swprPairsByToken0, swprPairsByToken1].map((wrappedPairs) => ({
    liquidityMiningPositions: {
      __args: {
        where: {
          user_in: addresses.map((address) => address.toLowerCase()),
          targetedPair_in: wrappedPairs.pairs.map((pair) => pair.id),
          stakedAmount_gt: 0
        },
        first: 1000
      },
      user: {
        id: true
      },
      stakedAmount: true,
      targetedPair: {
        totalSupply: true,
        reserve0: true,
        reserve1: true
      }
    }
  }));

  const liquidityMiningPositionsByToken0 = await subgraphRequest(
    swaprSubgraphUrl,
    liquidityMiningPositionsByToken0Query
  );
  const liquidityMiningPositionsByToken1 = await subgraphRequest(
    swaprSubgraphUrl,
    liquidityMiningPositionsByToken1Query
  );

  return {
    positionsByToken0: mergeStandardAndStakedPositions(
      liquidityPositionsByToken0.liquidityPositions,
      liquidityMiningPositionsByToken0.liquidityMiningPositions
    ),
    positionsByToken1: mergeStandardAndStakedPositions(
      liquidityPositionsByToken1.liquidityPositions,
      liquidityMiningPositionsByToken1.liquidityMiningPositions
    )
  };
};

const lpDataToBalanceMap = (
  positions: StandardLiquidityPosition[],
  useToken0Data: boolean
) => {
  return positions.reduce(
    (accumulator: { [address: string]: number }, position) => {
      const userLpTokenBalance = new Decimal(position.liquidityTokenBalance);
      const pairTotalSupply = new Decimal(position.pair.totalSupply);
      const userPoolPercentage = userLpTokenBalance.dividedBy(pairTotalSupply);
      const userHolding = new Decimal(
        useToken0Data ? position.pair.reserve0 : position.pair.reserve1
      ).mul(userPoolPercentage);
      const userAddress = getAddress(position.user.id);
      accumulator[userAddress] =
        (accumulator[userAddress] || 0) + userHolding.toNumber();
      return accumulator;
    },
    {}
  );
};

export const getSwaprLiquidityProvidersBalance = async (
  network,
  addresses,
  options,
  snapshot
): Promise<{
  [address: string]: number;
}> => {
  const { positionsByToken0, positionsByToken1 } = await getPositions(
    network,
    addresses,
    options,
    snapshot
  );
  const balanceMap: { [address: string]: number } = {};
  mergeBalanceMaps(balanceMap, lpDataToBalanceMap(positionsByToken0, true));
  mergeBalanceMaps(balanceMap, lpDataToBalanceMap(positionsByToken1, false));
  return balanceMap;
};
