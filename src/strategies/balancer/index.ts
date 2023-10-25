import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

export const author = 'bonustrack';
export const version = '0.2.0';

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

async function subgraphRequestWithPagination(subgraphURL, addresses, snapshot) {
  const chunkSize = 1000;
  const chunks: string[][] = [];
  for (let i = 0; i < addresses.length; i += chunkSize) {
    chunks.push(addresses.slice(i, i + chunkSize));
  }

  const results = { poolShares: [] };
  for (const chunk of chunks) {
    const params = {
      poolShares: {
        __args: {
          where: {
            userAddress_in: chunk.map((address) => address.toLowerCase()),
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
    const result = await subgraphRequest(subgraphURL, params);
    results.poolShares = results.poolShares.concat(result.poolShares);
  }

  return results;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  // iterate through Balancer V1 & V2 Subgraphs
  const score = {};
  for (let version = 1; version <= 2; version++) {
    // Skip attempt to query subgraph on networks where V1 isn't deployed
    if (network != 1 && network != 42 && version === 1) continue;

    const subgraphURL = buildBalancerSubgraphUrl(network, version);
    const result: any = await subgraphRequestWithPagination(
      subgraphURL,
      addresses,
      snapshot
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
