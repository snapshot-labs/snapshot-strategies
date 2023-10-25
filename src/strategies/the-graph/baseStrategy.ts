import { Provider } from '@ethersproject/providers';
import { getAddress } from '@ethersproject/address';
import { getTokenLockWallets } from './tokenLockWallets';

import {
  GraphAccountScores,
  GraphStrategyOptions,
  splitArray,
  StrategyFunction,
  verifyResults
} from './graphUtils';

const DEFAULT_PAGE_SIZE = 1000;
const VALID_STRATEGIES = ['balance', 'indexing', 'delegation'];

/**
 * Fetch scores for a list of addresses and their token-locked wallets
 *
 * @export
 * @param {string} _space snapshot space
 * @param {string} network networkId (i.e. ethereum mainnet = '1')
 * @param {Provider} _provider
 * @param {string[]} addresses
 * @param {GraphStrategyOptions} options
 * @param {(string | number)} snapshot 'latest' or blockNumber
 * @param {StrategyFunction} graphStrategy
 * @return {Promise<GraphAccountScores>} scores
 */
export async function getScoresPage(
  _space: string,
  network: string,
  _provider: Provider,
  addresses: string[],
  options: GraphStrategyOptions,
  snapshot: string | number,
  graphStrategy: StrategyFunction
): Promise<GraphAccountScores> {
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
  // Fetch scores for accounts and TLW
  const scores: GraphAccountScores = await graphStrategy(
    _space,
    network,
    _provider,
    allAccounts,
    options,
    snapshot
  );
  // Only run tests for specific block
  if (options.expectedResults && snapshot !== 'latest') {
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

  return combinedScores;
}

export async function baseStrategy(
  _space: string,
  network: string,
  _provider: Provider,
  _addresses: string[],
  options: GraphStrategyOptions,
  snapshot: string | number,
  graphStrategy: StrategyFunction
) {
  const addresses = _addresses.map((address) => address.toLowerCase());
  let combinedScores: GraphAccountScores = {};

  if (VALID_STRATEGIES.includes(options.strategyType)) {
    // Paginate and get combined scores
    const pageSize = options.pageSize || DEFAULT_PAGE_SIZE;
    const pages = splitArray(addresses, pageSize);
    for (const addressesPage of pages) {
      const pageScores = await getScoresPage(
        _space,
        network,
        _provider,
        addressesPage,
        { ...options, pageSize },
        snapshot,
        graphStrategy
      );
      combinedScores = { ...combinedScores, ...pageScores };
    }
  } else {
    console.error('ERROR: Strategy does not exist');
    return combinedScores;
  }
  // Only run tests for specific block
  if (options.expectedResults && snapshot !== 'latest') {
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
