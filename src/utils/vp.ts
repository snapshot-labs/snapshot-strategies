import snapshot from '@snapshot-labs/snapshot.js';
import { getProvider, getSnapshots } from '../utils';
import _strategies from '../strategies';
import { Snapshot, VotingPower, Protocol, Score } from '../types';

export async function getVp(
  address: string,
  network: string,
  strategies: any[],
  snapshotBlock: Snapshot,
  space: string
): Promise<VotingPower> {
  validateStrategies(strategies);

  const vpState = snapshotBlock === 'latest' ? 'pending' : 'final';

  if (!strategies.length) {
    return {
      vp: 0,
      vp_by_strategy: [],
      vp_state: vpState
    };
  }

  const { formattedAddress, addressType } = validateAndFormatAddress(address);
  const networks = [...new Set(strategies.map((s) => s.network || network))];
  const snapshots = await getSnapshots(
    network,
    snapshotBlock,
    getProvider(network),
    networks
  );

  const scores: Score[] = await Promise.all(
    strategies.map((strategy) => {
      const strategyNetwork = strategy.network || network;

      if (!_strategies[strategy.name].supportedProtocols.includes(addressType))
        return {};

      return _strategies[strategy.name].strategy(
        space,
        strategyNetwork,
        getProvider(strategyNetwork),
        [formattedAddress],
        strategy.params,
        snapshots[strategyNetwork]
      );
    })
  );

  const vpByStrategy = scores.map((score) => score[formattedAddress] || 0);

  return {
    vp: vpByStrategy.reduce((a, b) => a + b, 0),
    vp_by_strategy: vpByStrategy,
    vp_state: vpState
  };
}

function getAddressType(address: string): Protocol | null {
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) return 'evm';
  if (/^0x[a-fA-F0-9]{64}$/.test(address)) return 'starknet';
  return null;
}

function validateAndFormatAddress(address: string): {
  formattedAddress: string;
  addressType: Protocol;
} {
  const addressType = getAddressType(address);
  if (!addressType) {
    throw new Error('invalid address');
  }

  let formattedAddress: string;
  try {
    formattedAddress = snapshot.utils.getFormattedAddress(address, addressType);
  } catch {
    throw new Error('invalid address');
  }

  return { formattedAddress, addressType };
}

function validateStrategies(strategies: any[]): void {
  const invalidStrategies = strategies
    .filter((strategy) => !_strategies[strategy.name])
    .map((strategy) => strategy.name);

  if (invalidStrategies.length > 0) {
    throw new Error(`invalid strategies: ${invalidStrategies.join(', ')}`);
  }
}
