// Optimized Balancer strategy using poolId to narrow the poolShares returned by the graphql endpoint + using pagination for over 1000 poolshares

import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

export const author = 'jo-chemla';
export const version = '0.1.0';

const PAGE_SIZE = 1000;
const BALANCER_SUBGRAPH_URL_ROOT =
  'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer';

const NETWORK_KEY = {
  '1': '',
  '42': '-kovan',
  '137': '-polygon',
  '42161': '-arbitrum'
};

function buildBalancerSubgraphUrl(chainId, version) {
  const networkString = NETWORK_KEY[chainId];
  const versionString = version == 2 ? '-v2' : '';
  return `${BALANCER_SUBGRAPH_URL_ROOT}${networkString}${versionString}`;
}

const params = {
  pool: {
    __args: {
      id: ''
    },
    totalShares: true,
    tokens: {
      id: true,
      balance: true
    },
    shares: {
      __args: {
        where: {
          userAddress_in: [],
          balance_gt: 0
        },
        first: PAGE_SIZE
      },
      userAddress: {
        id: true
      },
      balance: true
    }
  }
};
export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  // @ts-ignore
  params.pool.__args.id = options.poolId
  params.pool.shares.__args.where.userAddress_in = addresses.map((address) => address.toLowerCase())
    
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.pool.__args.block = { number: snapshot };
  }

  // iterate through Balancer V1 & V2 Subgraphs
  const score = {};
  for (let version = 1; version <= 2; version++) {
    // Skip attempt to query subgraph on networks where V1 isn't deployed
    if (network != 1 && network != 42 && version === 1) continue;

    let page = 0;
    while (page !== -1) {
      // @ts-ignore
      params.pool.shares.__args.skip = page * PAGE_SIZE;

      const result = await subgraphRequest(
        buildBalancerSubgraphUrl(network, version),
        params
      );
      if (result && result.pool) {
        const pool = result.pool;
        pool.shares.forEach((poolShare) => {
          pool.tokens.map((poolToken) => {
            const [, tokenAddress] = poolToken.id.split('-');
            if (tokenAddress === options.token.toLowerCase()) {
              const userAddress = getAddress(poolShare.userAddress.id);
              if (!score[userAddress]) score[userAddress] = 0;
              score[userAddress] =
                score[userAddress] +
                (poolToken.balance / pool.totalShares) * poolShare.balance;
            }
          });
        });
        // If more shares, use pagination
        page = (pool.shares.length < PAGE_SIZE) ? -1 : page + 1;
      } else {
        page = -1;
      }
      console.log('version', version, 'page', page, score)
    }
  }
  return score || {};
}
export async function strategy_old(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const params = {
    poolShares: {
      __args: {
        where: {
          userAddress_in: addresses.map((address) => address.toLowerCase()),
          balance_gt: 0
        },
        first: 1000,
        orderBy: 'balance',
        orderDirection: 'desc'
      },
      userAddress: {
        id: true
      },
      balance: true,
      poolId: {
        totalShares: true,
        tokens: {
          id: true,
          balance: true
        }
      }
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.poolShares.__args.block = { number: snapshot };
  }

  // iterate through Balancer V1 & V2 Subgraphs
  const score = {};
  for (let version = 1; version <= 2; version++) {
    // Skip attempt to query subgraph on networks where V1 isn't deployed
    if (network != 1 && network != 42 && version === 1) continue;

    const result = await subgraphRequest(
      buildBalancerSubgraphUrl(network, version),
      params
    );
    if (result && result.poolShares) {
      result.poolShares.forEach((poolShare) =>
        poolShare.poolId.tokens.map((poolToken) => {
          const [, tokenAddress] = poolToken.id.split('-');
          if (tokenAddress === options.address.toLowerCase()) {
            const userAddress = getAddress(poolShare.userAddress.id);
            if (!score[userAddress]) score[userAddress] = 0;
            score[userAddress] =
              score[userAddress] +
              (poolToken.balance / poolShare.poolId.totalShares) *
                poolShare.balance;
          }
        })
      );
    }
  }
  return score || {};
}

// Working on https://thegraph.com/hosted-service/subgraph/balancer-labs/balancer-v2
/*
  {
  pool (
    id: "0xcb0e14e96f2cefa8550ad8e4aea344f211e5061d00020000000000000000011a"
  ) {
    id address name totalWeight 
    totalLiquidity totalShares holdersCount principalToken
    shares (
      where: {
        userAddress_in: [
          "0x0951ff0835302929d6c0162b3d2495a85e38ec3a",
          "0x5d577c1cdaf838b264c7d977449c776ef664d654",
          "0xefa5121ddac8d083a5a4c3d42e2bfaab2f0390dc",
          "0x0ddc793680ff4f5793849c8c6992be1695cbe72a",
        ]
      }
    ) {
      id
      userAddress { id }
      balance
      poolId {
        id
        totalShares
        tokens {
          id
          balance
        }
      }
    }
  }
}
*/
