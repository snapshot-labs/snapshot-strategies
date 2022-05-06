import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

const SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2'
};

export const author = 'weizard';
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
    liquidityPositions: {
      __args: {
        where: {
          user_in: addresses.map((address) => address.toLowerCase()),
          liquidityTokenBalance_gt: 0
        }
      },
      liquidityTokenBalance: true,
      user: {
        id: true
      },
      pair: {
        id: true,
        token0: {
          id: true
        },
        reserve0: true,
        token1: {
          id: true
        },
        reserve1: true,
        totalSupply: true
      }
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.liquidityPositions.__args.block = { number: snapshot };
  }
  const tokenAddress = options.address.toLowerCase();
  const result = await subgraphRequest(
    options.subGraphURL ? options.subGraphURL : SUBGRAPH_URL[network],
    params
  );
  const score = {};
  if (result && result.liquidityPositions) {
    console.log(
      result.liquidityPositions.filter(
        (lp) =>
          lp.pair.token0.id == tokenAddress || lp.pair.token1.id == tokenAddress
      )
    );
    result.liquidityPositions
      .filter(
        (lp) =>
          lp.pair.token0.id == tokenAddress || lp.pair.token1.id == tokenAddress
      )
      .forEach((lp) => {
        const token0perShard = lp.pair.reserve0 / lp.pair.totalSupply;
        const token1perShard = lp.pair.reserve1 / lp.pair.totalSupply;
        let userScore =
          lp.pair.token0.id == tokenAddress
            ? token0perShard * lp.liquidityTokenBalance
            : token1perShard * lp.liquidityTokenBalance;
        if (options.scoreMultiplier) {
          userScore = userScore * options.scoreMultiplier;
        }
        const userAddress = getAddress(lp.user.id);
        if (!score[userAddress]) score[userAddress] = 0;
        score[userAddress] = score[userAddress] + userScore;
      });
  }
  return score || {};
}
