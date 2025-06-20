import fetch from 'cross-fetch';
import _strategies from './strategies';
import snapshot from '@snapshot-labs/snapshot.js';
import { getDelegations } from './utils/delegation';
import { getVp, getDelegations as getCoreDelegations } from './utils/vp';
import { createHash } from 'crypto';
import { Protocol, Score, Snapshot } from './types';

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

export function getFormattedAddressesByProtocol(
  addresses: string[],
  protocols: Protocol[] = ['evm']
): string[] {
  if (!protocols.length) {
    throw new Error('At least one protocol must be specified');
  }

  return addresses
    .map((address) => {
      let evmAddress, starknetAddress;

      try {
        evmAddress = snapshot.utils.getFormattedAddress(address, 'evm');
      } catch (e) {}
      try {
        starknetAddress = snapshot.utils.getFormattedAddress(
          address,
          'starknet'
        );
      } catch (e) {}

      if (evmAddress && protocols.includes('evm')) {
        return evmAddress;
      }

      if (!evmAddress && starknetAddress && protocols.includes('starknet')) {
        return starknetAddress;
      }
    })
    .filter(Boolean);
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
  getScoresDirect,
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
