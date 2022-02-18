import _strategies from './strategies';
import snapshot from '@snapshot-labs/snapshot.js';
import { getDelegations } from './utils/delegation';

async function callStrategy(
  space,
  network,
  provider,
  addresses,
  strategy,
  snapshot
) {
  const score: any = await _strategies[strategy.name].strategy(
    space,
    network,
    provider,
    addresses,
    strategy.params,
    snapshot
  );

  // Filter score object to have only the addresses requested
  return Object.keys(score)
    .filter((key) =>
      addresses.map((a) => a.toLowerCase()).includes(key.toLowerCase())
    )
    .reduce((obj, key) => {
      obj[key] = score[key];
      return obj;
    }, {});
}

export async function getScoresDirect(
  space: string,
  strategies: any[],
  network: string,
  provider,
  addresses: string[],
  snapshot: number | string = 'latest'
) {
  try {
    return await Promise.all(
      strategies.map((strategy) =>
        (snapshot !== 'latest' && strategy.params?.start > snapshot) ||
        (strategy.params?.end &&
          (snapshot === 'latest' || snapshot > strategy.params?.end)) ||
        addresses.length === 0
          ? {}
          : callStrategy(
              space,
              network,
              provider,
              addresses,
              strategy,
              snapshot
            )
      )
    );
  } catch (e) {
    return Promise.reject(e);
  }
}

export const {
  multicall,
  Multicaller,
  subgraphRequest,
  ipfsGet,
  call,
  getBlockNumber,
  getProvider,
  SNAPSHOT_SUBGRAPH_URL
} = snapshot.utils;

export default {
  getScoresDirect,
  multicall,
  Multicaller,
  subgraphRequest,
  ipfsGet,
  call,
  getBlockNumber,
  getProvider,
  getDelegations,
  SNAPSHOT_SUBGRAPH_URL
};
