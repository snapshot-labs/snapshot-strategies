import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

const UNISWAP_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v2-dev'
};

export const author = 'snapshot-labs';
export const version = '0.1.0';

async function subgraphRequestWithPagination(subgraphURL, addresses, snapshot) {
  const chunkSize = 1000;
  const chunks: string[][] = [];
  for (let i = 0; i < addresses.length; i += chunkSize) {
    chunks.push(addresses.slice(i, i + chunkSize));
  }

  const results = { users: [] };
  for (const chunk of chunks) {
    const params = {
      users: {
        __args: {
          where: {
            id_in: chunk.map((address) => address.toLowerCase())
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
    const result = await subgraphRequest(subgraphURL, params);
    results.users = results.users.concat(result.users);
  }

  return results;
}

export async function strategy(
  _space,
  network,
  _provider,
  addresses,
  options,
  snapshot
) {
  const tokenAddress = options.address.toLowerCase();
  const subgraphURL = UNISWAP_SUBGRAPH_URL[network];
  const result: any = await subgraphRequestWithPagination(
    subgraphURL,
    addresses,
    snapshot
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
  return score || {};
}
