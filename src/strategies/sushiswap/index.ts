import { getAddress } from '@ethersproject/address';
import { formatUnits } from '@ethersproject/units';
import { subgraphRequest } from '../../utils';

const SUSHISWAP_SUBGRAPH_URL = {
  '1': {
    exchange: 'https://api.thegraph.com/subgraphs/name/sushiswap/exchange',
    masterChef: 'https://api.thegraph.com/subgraphs/name/sushiswap/master-chef'
  }
};

export const author = 'vfatouros';
export const version = '0.1.0';

async function getPairs(network, snapshot, token) {
  const getParams = (prop) => {
    const params = {
      pairs: {
        __args: {
          where: {
            [prop]: token.toLowerCase()
          },
          first: 1000
        },
        id: true,
        totalSupply: true,
        reserve0: true,
        reserve1: true,
        token0: {
          id: true,
          decimals: true
        },
        token1: {
          id: true,
          decimals: true
        }
      }
    };
    if (snapshot !== 'latest') {
      // @ts-ignore
      params.pairs.__args.block = { number: snapshot };
    }
    return params;
  };
  const [result1, result2] = await Promise.all(
    ['token0', 'token1'].map((prop) =>
      subgraphRequest(SUSHISWAP_SUBGRAPH_URL[network].exchange, getParams(prop))
    )
  );
  return Object.fromEntries(
    result1.pairs.concat(result2.pairs).map((pair) => {
      const isToken0 = pair.token0.id == token.toLowerCase();
      const rate = isToken0
        ? +pair.reserve0 / +pair.totalSupply
        : +pair.reserve1 / +pair.totalSupply;
      const decimals = isToken0 ? pair.token0.decimals : pair.token1.decimals;
      return [pair.id, { rate, decimals }];
    })
  );
}

async function getPools(network, snapshot, token) {
  const pairs = await getPairs(network, snapshot, token);
  const params = {
    pools: {
      __args: {
        where: {
          pair_in: Object.keys(pairs)
        },
        first: 1000
      },
      id: true,
      pair: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.pools.__args.block = { number: snapshot };
  }
  const result = await subgraphRequest(
    SUSHISWAP_SUBGRAPH_URL[network].masterChef,
    params
  );
  return Object.fromEntries(
    result.pools.map((pool) => [pool.id, pairs[pool.pair]])
  );
}

async function getStakedBalances(network, snapshot, token, addresses) {
  const pools = await getPools(network, snapshot, token);
  const params = {
    users: {
      __args: {
        where: {
          pool_in: Object.keys(pools),
          address_in: addresses.map((addr) => addr.toLowerCase())
        },
        first: 1000
      },
      address: true,
      amount: true,
      pool: {
        id: true
      }
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.users.__args.block = { number: snapshot };
  }
  const result = await subgraphRequest(
    SUSHISWAP_SUBGRAPH_URL[network].masterChef,
    params
  );
  return result.users.map((user) => {
    const pool = pools[user.pool.id];
    const amount =
      parseFloat(formatUnits(user.amount, pool.decimals)) * pool.rate;
    return {
      address: user.address,
      amount
    };
  });
}

export async function strategy(
  _space,
  network,
  _provider,
  addresses,
  options,
  snapshot
) {
  const params = {
    users: {
      __args: {
        where: {
          id_in: addresses.map((address) => address.toLowerCase())
        },
        first: 1000
      },
      id: true,
      liquidityPositions: {
        __args: {
          where: {
            liquidityTokenBalance_gt: 0
          }
        },
        liquidityTokenBalance: true,
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
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.users.liquidityPositions.__args.block = { number: snapshot };
  }
  const tokenAddress = options.address.toLowerCase();
  const result = await subgraphRequest(
    SUSHISWAP_SUBGRAPH_URL[network].exchange,
    params
  );
  const score = {};
  if (result && result.users) {
    result.users.forEach((u) => {
      u.liquidityPositions
        .filter(
          (lp) =>
            lp.pair.token0.id == tokenAddress ||
            lp.pair.token1.id == tokenAddress
        )
        .forEach((lp) => {
          const token0perUni = lp.pair.reserve0 / lp.pair.totalSupply;
          const token1perUni = lp.pair.reserve1 / lp.pair.totalSupply;
          const userScore =
            lp.pair.token0.id == tokenAddress
              ? token0perUni * lp.liquidityTokenBalance
              : token1perUni * lp.liquidityTokenBalance;

          const userAddress = getAddress(u.id);
          if (!score[userAddress]) score[userAddress] = 0;
          score[userAddress] = score[userAddress] + userScore;
        });
    });
  }
  if (options.useStakedBalances === 'true') {
    const stakedBalances = await getStakedBalances(
      network,
      snapshot,
      options.address,
      addresses
    );
    stakedBalances.forEach((balance) => {
      const userAddress = getAddress(balance.address);
      if (!score[userAddress]) score[userAddress] = 0;
      score[userAddress] += balance.amount;
    });
  }
  return score || {};
}
