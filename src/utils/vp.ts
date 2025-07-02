import {
  getFormattedAddressesByProtocol,
  getProvider,
  getSnapshots
} from '../utils';
import _strategies from '../strategies';
import { Score, Snapshot, VotingPower } from '../types';
import { DEFAULT_SUPPORTED_PROTOCOLS } from '../constants';

export async function getVp(
  address: string,
  network: string,
  strategies: any[],
  snapshot: Snapshot,
  space: string
): Promise<VotingPower> {
  const networks = [...new Set(strategies.map((s) => s.network || network))];
  const snapshots = await getSnapshots(
    network,
    snapshot,
    getProvider(network),
    networks
  );

  const p: Score[] = strategies.map((strategy) => {
    const n = strategy.network || network;

    const addresses = getFormattedAddressesByProtocol(
      [address],
      _strategies[strategy.name].supportedProtocols ??
        DEFAULT_SUPPORTED_PROTOCOLS
    );
    return _strategies[strategy.name].strategy(
      space,
      n,
      getProvider(n),
      addresses,
      strategy.params,
      snapshots[n]
    );
  });
  const scores = await Promise.all(p);

  const vpByStrategy = scores.map((score, i) => {
    const addresses = getFormattedAddressesByProtocol(
      [address],
      _strategies[strategies[i].name].supportedProtocols ??
        DEFAULT_SUPPORTED_PROTOCOLS
    );
    return addresses.reduce((a, b) => a + (score[b] || 0), 0);
  });
  const vp = vpByStrategy.reduce((a, b) => a + b, 0);
  const vpState = snapshot === 'latest' ? 'pending' : 'final';

  return {
    vp,
    vp_by_strategy: vpByStrategy,
    vp_state: vpState
  };
}
