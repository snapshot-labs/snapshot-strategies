// Types
import type { StaticJsonRpcProvider } from '@ethersproject/providers';

// Strategies
import { strategy as erc1155BalanceOfStrategy } from '../erc1155-balance-of';

type ScoresByAddress = {
  [address: string]: number;
};

type Params = {
  // Token Label
  symbol: string;
  // Contract Address
  address: string;
  // Token to measure holdings of
  tokenId: number;
  // Decimal places used by token
  decimals: number;
  // Strategy is extensible to Plural Voting by setting >1.
  // see https://www.radicalxchange.org/concepts/plural-voting/
  voiceCredits?: number;
};

const author = 'citydao';
const version = '0.0.1';

/**
 * CityDAO Square Root Snapshot Strategy
 * @version 0.0.1
 * @summary Holders of an ERC1155 token can cast a number of votes equal to the square root of their net token holdings.
 * @see https://archive.ph/beczV
 * @author Will Holley <https://721.dev>
 */
async function strategy(
  space: string,
  network: string,
  provider: StaticJsonRpcProvider,
  addresses: Array<string>,
  params: Params,
  snapshot: number
): Promise<ScoresByAddress> {
  // Query default scores.
  const scores: ScoresByAddress = await erc1155BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    params,
    snapshot
  );

  // Support Plural Voting
  const magnitude = params.voiceCredits || 1;

  // Update in place, rounding down.
  for (const address in scores) {
    scores[address] = Math.floor(Math.sqrt(scores[address] * magnitude));
  }

  return scores;
}

export { author, version, strategy };
