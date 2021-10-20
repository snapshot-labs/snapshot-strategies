import { Provider } from '@ethersproject/providers';
import { getAddress } from '@ethersproject/address';
import { getTokenLockWallets } from './tokenLockWallets';

import {
  GraphAccountScores,
  StrategyFunction,
  verifyResults
} from './graphUtils';

const VALID_STRATEGIES = ['balance', 'indexing', 'delegation'];

export async function baseStrategy(
  _space: string,
  network: string,
  _provider: Provider,
  addresses: string[],
  options: Record<string, any>,
  snapshot: string | number,
  graphStrategy: StrategyFunction
) {
  addresses = addresses.map((address) => address.toLowerCase());
  const tokenLockWallets = await getTokenLockWallets(
    _space,
    network,
    _provider,
    addresses,
    options,
    snapshot
  );

  // Take the token lock wallets object and turn it into an array, pass it into the other strategies
  const allAccounts = [...addresses];
  for (const beneficiary in tokenLockWallets) {
    tokenLockWallets[beneficiary].forEach((tw) => {
      allAccounts.push(tw);
    });
  }

  let scores: GraphAccountScores = {};
  if (VALID_STRATEGIES.includes(options.strategyType)) {
    scores = await graphStrategy(
      _space,
      network,
      _provider,
      allAccounts,
      options,
      snapshot
    );
  } else {
    console.error('ERROR: Strategy does not exist');
  }

  if (options.expectedResults) {
    verifyResults(
      JSON.stringify(scores),
      JSON.stringify(options.expectedResults.scores),
      'Scores'
    );
  }

  // Combine the Token lock votes into the beneficiaries votes
  const combinedScores: GraphAccountScores = {};
  for (const account of addresses) {
    let accountScore = scores[account];
    // It was found that this beneficiary has token lock wallets, lets add them
    if (tokenLockWallets[account] != null) {
      tokenLockWallets[account].forEach((tw) => {
        accountScore = accountScore + scores[tw];
      });
    }
    combinedScores[account] = accountScore;
  }

  if (options.expectedResults) {
    verifyResults(
      JSON.stringify(combinedScores),
      JSON.stringify(options.expectedResults.combinedScores),
      'Combined scores'
    );
  }

  return Object.fromEntries(
    Object.entries(combinedScores).map((score) => [
      getAddress(score[0]),
      score[1]
    ])
  );
}
