// Types
import type { StaticJsonRpcProvider } from '@ethersproject/providers';

// Strategies
import { strategy as erc1155BalanceOfStrategy } from '../erc1155-balance-of';

type ScoresByAddress = {
  [address: string]: number;
};

type Params = {
  symbol: string;
  address: string;
  tokenId: number;
  decimals: number;
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

  // Update in place, rounding down.
  for (const address in scores) {
    scores[address] = Math.floor(Math.sqrt(scores[address]));
  }

  return scores;
}

export { author, version, strategy };
