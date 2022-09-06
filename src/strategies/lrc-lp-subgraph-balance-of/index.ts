import { BigNumber } from '@ethersproject/bignumber';
import { subgraphRequest } from '../../utils';

export const author = 'shad-k';
export const version = '0.1.1';

const LIMIT = 500;

function makeUserQuery(snapshot, addresses, tokenIds) {
  const query: any = {
    accounts: {
      __args: {
        where: {
          address_in: addresses
        },
        first: LIMIT
      },
      balances: {
        __args: {
          where: {
            token_in: tokenIds
          }
        },
        balance: true,
        token: {
          id: true,
          decimals: true
        }
      },
      address: true
    }
  };

  if (snapshot !== 'latest') {
    query.accounts.__args = {
      ...query.accounts.__args,
      block: {
        number: snapshot
      }
    };
  }

  return query;
}

function makePoolQuery(snapshot, addresses, tokenIds) {
  const query: any = {
    pools: {
      __args: {
        where: {
          address_in: addresses
        }
      },
      address: true,
      balances: {
        __args: {
          where: {
            token_in: ['1', ...tokenIds]
          }
        },
        balance: true,
        token: {
          id: true,
          decimals: true
        }
      }
    }
  };

  if (snapshot !== 'latest') {
    query.pools.__args = {
      ...query.pools.__args,
      block: {
        number: snapshot
      }
    };
  }

  return query;
}

function calculateUserScore(
  addressToBalancesMap,
  calculatedPoolMultipliers,
  tokenIdToPoolMap
): number {
  let score = 0;

  addressToBalancesMap.forEach(({ balance, token }) => {
    const tokenBalance = BigNumber.from(balance);

    const lpTokenScore = tokenBalance
      .mul(
        calculatedPoolMultipliers[tokenIdToPoolMap[token?.id]].numOfLRCInPool
      )
      .div(
        calculatedPoolMultipliers[tokenIdToPoolMap[token?.id]].totalLPTokens
      );

    score += lpTokenScore.toNumber();
  });

  return score;
}

function calculatePoolMultipliers(
  poolToBalancesMap
): Record<string, Record<string, BigNumber>> {
  return Object.fromEntries(
    Object.keys(poolToBalancesMap).map((poolAddress) => {
      let numOfLRCInPool = BigNumber.from(0);
      let totalLPTokens = BigNumber.from(0);

      poolToBalancesMap[poolAddress].forEach(({ balance, token }) => {
        if (parseInt(token.id) === 1) {
          const lrcTokenBalance = BigNumber.from(balance).div(
            BigNumber.from(10).pow(token?.decimals ?? 18)
          );
          numOfLRCInPool = lrcTokenBalance;
        } else {
          const lpTokenBalance = BigNumber.from(balance);
          totalLPTokens = BigNumber.from(2).pow(96).sub(lpTokenBalance);
        }
      });

      return [poolAddress, { numOfLRCInPool, totalLPTokens }];
    })
  );
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const _addresses = addresses.map((address) => address.toLowerCase());
  const addressSubsets = Array.apply(
    null,
    Array(Math.ceil(_addresses.length / LIMIT))
  ).map((_e, i) => _addresses.slice(i * LIMIT, (i + 1) * LIMIT));

  const tokenIds: Array<string> = [];
  const poolAddresses: Array<string> = [];

  // get tokenIds and poolAddresses from tokenIdToPoolMap
  for (const [tokenId, poolAddress] of Object.entries(
    options.tokenIdToPoolMap
  )) {
    tokenIds.push(tokenId);
    poolAddresses.push(poolAddress as string);
  }

  // fetch user LP token balances
  const response = await Promise.all(
    addressSubsets.map((subset) =>
      subgraphRequest(options.graph, makeUserQuery(snapshot, subset, tokenIds))
    )
  );

  const accounts = response.map((data) => data.accounts).flat();
  const addressToLPBalancesMap = Object.fromEntries(
    accounts.map((account) => {
      if (account.balances.length > 0) {
        return [account.address, account.balances];
      }

      return [account.address, []];
    })
  );

  // fetch pool LP and LRC token balances
  const poolAccountBalances = await subgraphRequest(
    options.graph,
    makePoolQuery(snapshot, poolAddresses, tokenIds)
  );

  const poolToBalancesMap = Object.fromEntries(
    poolAccountBalances.pools.map((pool) => {
      if (pool.balances.length > 0) {
        return [pool.address, pool.balances];
      }

      return [pool.address, 0];
    })
  );

  // calculate numOfLRCInPool and totalLPTokens for each pool
  const calculatedPoolMultipliers = calculatePoolMultipliers(poolToBalancesMap);

  // calculate user score
  const addressToScoreMap = Object.fromEntries(
    Object.keys(addressToLPBalancesMap).map((userAddress) => {
      const userScore = calculateUserScore(
        addressToLPBalancesMap[userAddress],
        calculatedPoolMultipliers,
        options.tokenIdToPoolMap
      );

      return [userAddress.toLowerCase(), userScore];
    })
  );

  const scores = Object.fromEntries(
    addresses.map((address) => [
      address,
      addressToScoreMap[address.toLowerCase()]
    ])
  );

  return scores;
}
