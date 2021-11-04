import { Provider } from '@ethersproject/providers';
import { BigNumber } from '@ethersproject/bignumber';
import { subgraphRequest } from '../../utils';
import {
  GRAPH_NETWORK_SUBGRAPH_URL,
  bnWEI,
  bdMulBn,
  GraphAccountScores,
  calcNonStakedTokens,
  verifyResults,
  GraphStrategyOptions
} from '../the-graph/graphUtils';

export async function delegatorsStrategy(
  _space: string,
  network: string,
  _provider: Provider,
  addresses: string[],
  options: GraphStrategyOptions,
  snapshot: string | number
): Promise<GraphAccountScores> {
  const delegatorsParams = {
    graphAccounts: {
      __args: {
        where: {
          id_in: addresses
        },
        first: options.pageSize
      },
      id: true,
      delegator: {
        stakes: {
          shareAmount: true,
          lockedTokens: true,
          indexer: {
            delegationExchangeRate: true
          }
        }
      }
    },
    graphNetworks: {
      __args: {
        first: 1000
      },
      totalSupply: true,
      totalDelegatedTokens: true,
      totalTokensStaked: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    delegatorsParams.graphAccounts.__args.block = { number: snapshot };
    // @ts-ignore
    delegatorsParams.graphNetworks.__args.block = { number: snapshot };
  }

  const result = await subgraphRequest(
    GRAPH_NETWORK_SUBGRAPH_URL[network],
    delegatorsParams
  );

  const score: GraphAccountScores = {};
  let normalizationFactor = 0;
  if (result && result.graphNetworks) {
    const nonStakedTokens = calcNonStakedTokens(
      result.graphNetworks[0].totalSupply,
      result.graphNetworks[0].totalTokensStaked,
      result.graphNetworks[0].totalDelegatedTokens
    );
    // The normalization factor gives more weight to delegated stake
    // over GRT holded
    normalizationFactor =
      nonStakedTokens /
      BigNumber.from(result.graphNetworks[0].totalDelegatedTokens)
        .div(bnWEI)
        .toNumber();
  }

  if (options.expectedResults && snapshot !== 'latest') {
    verifyResults(
      normalizationFactor.toString(),
      options.expectedResults.normalizationFactor.toString(),
      'Normalization factor'
    );
  }

  if (result && result.graphAccounts) {
    addresses.forEach((a) => {
      let delegationScore = 0;
      for (let i = 0; i < result.graphAccounts.length; i++) {
        if (result.graphAccounts[i].id == a) {
          if (result.graphAccounts[i].delegator != null) {
            // Find all stakes from the delegator
            // and sum the delegated and locked tokens for each
            result.graphAccounts[i].delegator.stakes.forEach((s) => {
              const delegatedTokens = bdMulBn(
                s.indexer.delegationExchangeRate,
                s.shareAmount
              );
              const lockedTokens = BigNumber.from(s.lockedTokens);
              const oneDelegationScore = delegatedTokens
                .add(lockedTokens)
                .div(bnWEI)
                .toNumber();
              delegationScore = delegationScore + oneDelegationScore;
            });
            // Apply normalization factor to the total delegated GRT
            delegationScore = delegationScore * normalizationFactor;
          }
          break;
        }
      }
      score[a] = delegationScore;
    });
  } else {
    console.error('Subgraph request failed');
  }
  return score || {};
}
