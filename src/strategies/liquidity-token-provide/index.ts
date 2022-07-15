import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

const SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/dinngodev/furucombo-tokenomics-mainnet',
  '137':
    'https://api.thegraph.com/subgraphs/name/dinngodev/furucombo-tokenomics-polygon'
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
    result.liquidityPositions.forEach((lp) => {
      if (
        lp.pair.token0.id !== tokenAddress &&
        lp.pair.token1.id !== tokenAddress
      )
        return;
      let userScore =
        lp.pair.token0.id == tokenAddress
          ? (lp.pair.reserve0 / lp.pair.totalSupply) * lp.liquidityTokenBalance
          : (lp.pair.reserve1 / lp.pair.totalSupply) * lp.liquidityTokenBalance;
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
