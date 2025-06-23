import fetch from 'cross-fetch';
import _strategies from './strategies';
import snapshot from '@snapshot-labs/snapshot.js';
import { getDelegations } from './utils/delegation';
import { getVp, getDelegations as getCoreDelegations } from './utils/vp';
import { createHash } from 'crypto';
import { Protocol, Score, Snapshot } from './types';
import { VALID_PROTOCOLS } from './constants';

export function sha256(str) {
  return createHash('sha256').update(str).digest('hex');
}

async function callStrategy(
  space: string,
  network,
  addresses: string[],
  strategy,
  snapshot: Snapshot
): Promise<Score> {
  if (
    (snapshot !== 'latest' && strategy.params?.start > snapshot) ||
    (strategy.params?.end &&
      (snapshot === 'latest' || snapshot > strategy.params?.end))
  ) {
    return {};
  }

  if (!_strategies.hasOwnProperty(strategy.name)) {
    throw new Error(`Invalid strategy: ${strategy.name}`);
  }

  const score: Score = await _strategies[strategy.name].strategy(
    space,
    network,
    getProvider(network),
    addresses,
    strategy.params,
    snapshot
  );
  const addressesLc = addresses.map((address) => address.toLowerCase());
  return Object.fromEntries(
    Object.entries(score).filter(
      ([address, vp]) => vp > 0 && addressesLc.includes(address.toLowerCase())
    )
  );
}

export async function getScoresDirect(
  space: string,
  strategies: any[],
  network: string,
  provider,
  addresses: string[],
  snapshot: Snapshot
): Promise<Score[]> {
  try {
    const networks = strategies.map((s) => s.network || network);
    const snapshots = await getSnapshots(network, snapshot, provider, networks);
    // @ts-ignore
    if (addresses.length === 0) return strategies.map(() => ({}));
    return await Promise.all(
      strategies.map((strategy) =>
        callStrategy(
          space,
          strategy.network || network,
          addresses,
          strategy,
          snapshots[strategy.network || network]
        )
      )
    );
  } catch (e) {
    return Promise.reject(e);
  }
}

export function customFetch(
  url: RequestInfo | URL,
  options: RequestInit = {},
  timeout = 20000
): Promise<any> {
  const controller = new AbortController();
  const { signal } = controller;
  const fetchOptions = { ...options, signal };

  return Promise.race([
    fetch(url, fetchOptions).catch((error) => {
      if (error.name === 'AbortError') {
        throw new Error('API request timeout');
      }
      throw error;
    }),
    new Promise((_, reject) =>
      setTimeout(() => {
        controller.abort();
        reject(new Error('API request timeout'));
      }, timeout)
    )
  ]);
}

/**
 * Validates that protocols are non-empty and contain only valid protocol names.
 *
 * @param protocols - Array of protocol names to validate
 */
function validateProtocols(protocols: Protocol[]): void {
  if (!protocols.length) {
    throw new Error('At least one protocol must be specified');
  }

  const invalidProtocols = protocols.filter(
    (p) => !VALID_PROTOCOLS.includes(p)
  );
  if (invalidProtocols.length > 0) {
    throw new Error(`Invalid protocol(s): ${invalidProtocols.join(', ')}`);
  }
}

/**
 * Formats addresses according to the specified blockchain protocols.
 *
 * This function takes a list of addresses and formats them according to the provided
 * protocols. It prioritizes EVM formatting when multiple protocols are specified and
 * an address is valid for both. If EVM formatting fails but Starknet is supported,
 * it falls back to Starknet formatting. Throws an error if any address cannot be
 * formatted according to the specified protocols.
 *
 * @param addresses - Array of blockchain addresses to format
 * @param protocols - Array of protocol names to validate against. Defaults to ['evm'].
 *                   Valid protocols are 'evm' and 'starknet'.
 *
 * @returns Array of formatted addresses in the same order as input
 */
export function getFormattedAddressesByProtocol(
  addresses: string[],
  protocols: Protocol[] = ['evm']
): string[] {
  validateProtocols(protocols);

  return addresses.map((address) => {
    if (protocols.includes('evm')) {
      try {
        return snapshot.utils.getFormattedAddress(address, 'evm');
      } catch (e) {
        // Continue to starknet if evm formatting fails and starknet is supported
      }
    }

    if (protocols.includes('starknet')) {
      try {
        return snapshot.utils.getFormattedAddress(address, 'starknet');
      } catch (e) {
        // Address format not supported by any protocol
      }
    }

    throw new Error(
      `Address "${address}" is not a valid ${protocols.join(' or ')} address`
    );
  });
}

export const {
  multicall,
  Multicaller,
  subgraphRequest,
  ipfsGet,
  call,
  getDelegatesBySpace,
  getBlockNumber,
  getProvider,
  getSnapshots,
  getFormattedAddress,
  SNAPSHOT_SUBGRAPH_URL
} = snapshot.utils;

export default {
  sha256,
  getScoresDirect,
  customFetch,
  getFormattedAddressesByProtocol,
  multicall,
  Multicaller,
  subgraphRequest,
  ipfsGet,
  call,
  getDelegatesBySpace,
  getBlockNumber,
  getProvider,
  getDelegations,
  getSnapshots,
  getFormattedAddress,
  SNAPSHOT_SUBGRAPH_URL,
  getVp,
  getCoreDelegations
};
