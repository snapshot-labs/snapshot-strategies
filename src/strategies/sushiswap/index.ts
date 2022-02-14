import { getAddress } from '@ethersproject/address';
import { formatUnits } from '@ethersproject/units';
import { subgraphRequest } from '../../utils';

// Minichef: https://github.com/sushiswap/sushiswap-interface/blob/master/src/services/graph/fetchers/masterchef.ts
// Exchange: https://github.com/sushiswap/sushiswap-interface/blob/master/src/services/graph/fetchers/exchange.ts

const theGraph_baseUrl = 'https://api.thegraph.com/subgraphs/name/';
const SUSHISWAP_SUBGRAPH_URL = {
  exchange: {
    '1': 'sushiswap/exchange',
    '100': 'sushiswap/xdai-exchange',
    '137': 'sushiswap/matic-exchange',
    '250': 'sushiswap/fantom-exchange',
    '42161': 'sushiswap/arbitrum-exchange',
    '1285': 'sushiswap/moonriver-exchange',
    '42220': 'jiro-ono/sushitestsubgraph',
    '122': 'sushiswap/fuse-exchange',
    '1666600000': 'sushiswap/harmony-exchange',
    '56': 'sushiswap/bsc-exchange',
    '43114': 'sushiswap/avalanche-exchange',
    '66': 'okex-exchange/oec',
    '128': 'heco-exchange/heco'
  },
  masterChef: {
    '1': 'sushiswap/master-chef',
    '100': 'matthewlilley/xdai-minichef', // Could be replaced by 'sushiswap/xdai-minichef'
    '137': 'sushiswap/matic-minichef',
    '250': 'sushiswap/fantom-minichef',
    '42161': 'matthewlilley/arbitrum-minichef',
    '1285': 'sushiswap/moonriver-minichef',
    '42220': 'sushiswap/celo-minichef-v2',
    '122': 'sushiswap/fuse-minichef',
    '1666600000': 'sushiswap/harmony-minichef'
  },
  masterChefV2: {
    '1': 'sushiswap/master-chefv2'
  }
};

const PAGE_SIZE = 1000;

export const author = 'maxaleks';
export const version = '0.2.0';

async function getPairs(network, snapshot, token) {
  const getParams = (tokenId, page) => {
    const params = {
      pairs: {
        __args: {
          where: {
            [tokenId]: token.toLowerCase()
          },
          first: PAGE_SIZE,
          skip: page * PAGE_SIZE
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
  const requestPairs = async (tokenId) => {
    let pairs = [];
    let page = 0;
    while (true) {
      const result = await subgraphRequest(
        theGraph_baseUrl + SUSHISWAP_SUBGRAPH_URL.exchange[network],
        getParams(tokenId, page)
      );
      pairs = pairs.concat(result.pairs);
      page++;
      if (result.pairs.length < PAGE_SIZE) break;
    }
    return pairs;
  };
  const [pairs1, pairs2] = await Promise.all(
    ['token0', 'token1'].map((tokenId) => requestPairs(tokenId))
  );
  return Object.fromEntries(
    pairs1.concat(pairs2).map((pair: any) => {
      const isToken0 = pair.token0.id == token.toLowerCase();
      const rate = isToken0
        ? +pair.reserve0 / +pair.totalSupply
        : +pair.reserve1 / +pair.totalSupply;
      const decimals = isToken0 ? pair.token0.decimals : pair.token1.decimals;
      return [pair.id, { rate, decimals }];
    })
  );
}

async function getPools(network, snapshot, token, masterChefUrl) {
  const pairs = await getPairs(network, snapshot, token);
  const params = {
    pools: {
      __args: {
        where: {
          pair_in: Object.keys(pairs)
        },
        first: PAGE_SIZE
      },
      id: true,
      pair: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.pools.__args.block = { number: snapshot };
  }
  let pools = [];
  let page = 0;
  while (true) {
    // @ts-ignore
    params.pools.__args.skip = page * PAGE_SIZE;
    const result = await subgraphRequest(masterChefUrl, params);
    pools = pools.concat(result.pools);
    page++;
    if (result.pools.length < PAGE_SIZE) break;
  }
  return Object.fromEntries(
    pools.map((pool: any) => [pool.id, pairs[pool.pair]])
  );
}

async function getStakedBalances(network, snapshot, options, addresses) {
  const token = options.address;
  // Only allow the masterChefVersion key to be v2 if on mainnet, otherwise fallback to v1
  const masterchefSuffix =
    network == '1' && options.masterchefVersion == 'v2'
      ? SUSHISWAP_SUBGRAPH_URL.masterChefV2[network]
      : SUSHISWAP_SUBGRAPH_URL.masterChef[network];
  const masterChefUrl = theGraph_baseUrl + masterchefSuffix;
  const pools = await getPools(network, snapshot, token, masterChefUrl);
  const params = {
    users: {
      __args: {
        where: {
          pool_in: Object.keys(pools),
          address_in: addresses.map((addr) => addr.toLowerCase())
        },
        first: PAGE_SIZE
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

  let users = [];
  let page = 0;
  while (true) {
    // @ts-ignore
    params.users.__args.skip = page * PAGE_SIZE;
    const result = await subgraphRequest(masterChefUrl, params);
    users = users.concat(result.users);
    page++;
    if (result.users.length < PAGE_SIZE) break;
  }

  return users.map((user: any) => {
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
    theGraph_baseUrl + SUSHISWAP_SUBGRAPH_URL.exchange[network],
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
  if (
    options.useStakedBalances === 'true' &&
    SUSHISWAP_SUBGRAPH_URL.masterChef[network]
  ) {
    const stakedBalances = await getStakedBalances(
      network,
      snapshot,
      options,
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
