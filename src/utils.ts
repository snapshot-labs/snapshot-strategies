import _strategies from './strategies';
import snapshot from '@snapshot-labs/snapshot.js';

const PAGINATION_LIMIT = 500;
function callPagination(
  space,
  network,
  provider,
  addresses,
  strategy,
  snapshot
) {
  if (addresses.length > PAGINATION_LIMIT) {
    return _strategies['pagination'].strategy(
      space,
      network,
      provider,
      addresses,
      {
        limit: PAGINATION_LIMIT,
        strategy: {
          name: strategy.name,
          params: strategy.params
        }
      },
      snapshot
    );
  }
  return _strategies[strategy.name].strategy(
    space,
    network,
    provider,
    addresses,
    strategy.params,
    snapshot
  );
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
          : callPagination(
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
