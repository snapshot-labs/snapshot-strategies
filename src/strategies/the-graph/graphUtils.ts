import { parseUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { Provider } from '@ethersproject/providers';

export const GRAPH_NETWORK_SUBGRAPH_URL = {
  '1':
    'https://api.thegraph.com/subgraphs/name/graphprotocol/graph-network-mainnet',
  '4':
    'https://api.thegraph.com/subgraphs/name/graphprotocol/graph-network-testnet'
};
export const bnWEI = BigNumber.from('1000000000000000000');

export interface GraphAccountScores {
  [key: string]: number;
}

export type StrategyFunction = (
  // Snapshot space
  space: string,
  // networkId (i.e. ethereum mainnet = '1')
  network: string,
  provider: Provider,
  addresses: string[],
  // These are the parameters you can configure in your space settings
  // for the strategy. It's up to the strategy developer to define the
  // shape of the options and inform them in the README.md of the strategy
  // so users know how to configure it
  options: Record<string, any>,
  // 'latest' or a blockNumber used to ignore votes from newer participants
  snapshot: string | number
) => Promise<Record<string, number>>; // mapping of addresses to scores

/**
 * Pass in a BigDecimal and BigNumber from a subgraph query, and return the multiplication of
 * them as a BigNumber
 * */
export function bdMulBn(bd: string, bn: string): BigNumber {
  const splitDecimal = bd.split('.');
  let split;
  // Truncate the BD so it can be converted to a BN (no decimals) when multiplied by WEI
  if (splitDecimal.length > 1) {
    split = `${splitDecimal[0]}.${splitDecimal[1].slice(0, 18)}`;
  } else {
    // Didn't have decimals, even though it was BigDecimal (i.e. "2")
    return BigNumber.from(bn).mul(BigNumber.from(bd));
  }

  // Convert it to BN
  const bdWithWEI = parseUnits(split, 18);

  // Multiple, then divide by WEI to have it back in BN
  return BigNumber.from(bn).mul(bdWithWEI).div(bnWEI);
}

export function calcNonStakedTokens(
  totalSupply: string,
  totalTokensStaked: string,
  totalDelegatedTokens: string
): number {
  return BigNumber.from(totalSupply)
    .sub(BigNumber.from(totalTokensStaked))
    .sub(BigNumber.from(totalDelegatedTokens))
    .div(bnWEI)
    .toNumber();
}

export function verifyResults(
  result: string,
  expectedResults: string,
  type: string
): void {
  result === expectedResults
    ? console.log(`>>> SUCCESS: ${type} match expected results`)
    : console.error(`>>> ERROR: ${type} do not match expected results`);
}
