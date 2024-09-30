import { getAddress } from '@ethersproject/address';
import { formatUnits } from '@ethersproject/units';
import { subgraphRequest } from '../../utils';

// Minichef: https://github.com/sushiswap/sushiswap-interface/blob/master/src/services/graph/fetchers/masterchef.ts
// Exchange: https://github.com/sushiswap/sushiswap-interface/blob/master/src/services/graph/fetchers/exchange.ts

const theGraph_baseUrl = 'https://subgrapher.snapshot.org/subgraph/arbitrum/';
const SUSHISWAP_SUBGRAPH_URL = {
  exchange: {
    '1': '6NUtT5mGjZ1tSshKLf5Q3uEEJtjBZJo1TpL5MXsUBqrT',
    '100': '4a8hcsttqsmycmmeFcpffGMZhBDU4NhHfyHH6YNcnu7b',
    '137': '8NiXkxLRT3R22vpwLB4DXttpEf3X1LrKhe4T1tQ3jjbP',
    '250': '3nozHyFKUhxnEvekFg5G57bxPC5V63eiWbwmgA35N5VK',
    '42161': '8nFDCAhdnJQEhQF3ZRnfWkJ6FkRsfAiiVabVn4eGoAZH',
    '1285': '5skUrJzgVm6vXAmdKN7gw4CjYx3pgLDeUeUqVzqLXkWT',
    // '42220': 'jiro-ono/sushitestsubgraph', no upgraded subgraph
    '122': 'BumyXJR9Cnzoy7nj4tbCsDwVe59e7ktXR1ELNjhEvimp',
    '1666600000': 'FrcJBCCKCYGTLLXJmhppXfPKsNoyod4zqNLjHfXj1KHg',
    '56': 'GPRigpbNuPkxkwpSbDuYXbikodNJfurc1LCENLzboWer',
    '43114': '6VAhbtW5u2sPYkJKAcMsxgqTBu4a1rqmbiVQWgtNjrvT'
    // '66': 'okex-exchange/oec', No subgraph
    // '128': 'heco-exchange/heco' No subgraph
  },
  masterChef: {
    '1': 'AkCK7BgZJHVwjDdxbnaER1e2XPpywnXVkVZV4p7QGnua',
    // '100': 'matthewlilley/xdai-minichef', // Could be replaced by 'sushiswap/xdai-minichef' No upgraded subgraph
    // '137': 'sushiswap/matic-minichef', No upgraded subgraph
    '250': 'GJXdaT5S7BHvGNxJSLJsMH36tB4w3Z7eES6jSDJuqddg',
    // '42161': 'matthewlilley/arbitrum-minichef', No upgraded subgraph
    '1285': 'ExyevfNrFJ7EhTK74MDJ823h6oKkqUpwnVP1h3EuN8oa',
    '42220': 'Aodb24RhU4p1p6p4ooq1Rwu5aVXhULAvXEGg8QEaPBvg',
    '122': 'GdVirDDQ2fg43pjt2cZiH9Uar7bhGfySvm4jiQ9fVD4u'
    // '1666600000': 'sushiswap/harmony-minichef' No Subgraph
  },
  masterChefV2: {
    '1': 'FAa1YU79pPDUKj8vtkUPZGzCcPVS6Edg1md5LsRHSKWb'
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
