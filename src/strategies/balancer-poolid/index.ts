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
  params.pool.__args.id = options.poolId;
  params.pool.shares.__args.where.userAddress_in = addresses.map((address) =>
    address.toLowerCase()
  );

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
                (poolShare.balance / pool.totalShares) * poolToken.balance;
            }
          });
        });
        // If more shares, use pagination
        page = pool.shares.length < PAGE_SIZE ? -1 : page + 1;
      } else {
        page = -1;
      }
    }
  }
  return score || {};
}
