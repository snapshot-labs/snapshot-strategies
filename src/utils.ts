import fetch from 'cross-fetch';
import _strategies from './strategies';
import snapshot from '@snapshot-labs/snapshot.js';
import { getDelegations } from './utils/delegation';
import { createHash } from 'crypto';
import { Protocol, Score, Snapshot, VotingPower } from './types';

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
    if (addresses.length === 0) return strategies.map(() => ({}));

    const addressesByProtocols = validateAndFormatAddresses(addresses);
    validateStrategies(strategies);

    const networks = [...new Set(strategies.map((s) => s.network || network))];
    const snapshots = await getSnapshots(network, snapshot, provider, networks);

    return await Promise.all(
      strategies.map((strategy) =>
        callStrategy(
          space,
          strategy.network || network,
          getAddressesFromSupportedProtocols(
            addressesByProtocols,
            strategy.name
          ),
          strategy,
          snapshots[strategy.network || network]
        )
      )
    );
  } catch (e) {
    return Promise.reject(e);
  }
}

export async function getVp(
  address: string,
  network: string,
  strategies: any[],
  snapshot: Snapshot,
  space: string
): Promise<VotingPower> {
  validateStrategies(strategies, { allowEmpty: false });

  const scores = await getScoresDirect(
    space,
    strategies,
    network,
    getProvider(network),
    [address],
    snapshot
  );

  const vpByStrategy = scores.map((score) => {
    const matchingKey = Object.keys(score).find(
      (key) => key.toLowerCase() === address.toLowerCase()
    );
    return matchingKey ? score[matchingKey] : 0;
  });

  return {
    vp: vpByStrategy.reduce((a, b) => a + b, 0),
    vp_by_strategy: vpByStrategy,
    vp_state: snapshot === 'latest' ? 'pending' : 'final'
  };
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

function getAddressType(address: string): Protocol | null {
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) return 'evm';
  if (/^0x[a-fA-F0-9]{64}$/.test(address)) return 'starknet';
  return null;
}

function validateAndFormatAddresses(
  addresses: string[]
): Record<Protocol, string[]> {
  const results: Record<Protocol, string[]> = {
    evm: [],
    starknet: []
  };

  for (const address of addresses) {
    const addressType = getAddressType(address);
    if (!addressType) {
      throw new Error('invalid address');
    }

    try {
      results[addressType].push(
        snapshot.utils.getFormattedAddress(address, addressType)
      );
    } catch {
      throw new Error('invalid address');
    }
  }

  return results;
}

function getAddressesFromSupportedProtocols(
  addressesByProtocols: Record<Protocol, string[]>,
  strategyName: string
): string[] {
  return Object.entries(addressesByProtocols)
    .filter(([protocol]) =>
      _strategies[strategyName].supportedProtocols.includes(protocol)
    )
    .flatMap(([, addresses]) => addresses);
}

function validateStrategies(
  strategies: any[],
  { allowEmpty = true }: { allowEmpty?: boolean } = {}
): void {
  if (!strategies.length && !allowEmpty) {
    throw new Error('no strategies provided');
  }

  const invalidStrategies = strategies
    .filter((strategy) => !_strategies[strategy.name])
    .map((strategy) => strategy.name);

  if (invalidStrategies.length > 0) {
    throw new Error(`Invalid strategies: ${invalidStrategies.join(', ')}`);
  }
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
  getVp
};
