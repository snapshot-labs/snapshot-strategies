import _strategies from './strategies';
import snapshot from '@snapshot-labs/snapshot.js';

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
          : _strategies[strategy.name].strategy(
              space,
              network,
              provider,
              addresses,
              strategy.params,
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
  getProvider
} = snapshot.utils;

export default {
  getScoresDirect,
  multicall,
  Multicaller,
  subgraphRequest,
  ipfsGet,
  call,
  getBlockNumber,
  getProvider
};
