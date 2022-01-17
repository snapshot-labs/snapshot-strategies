import { subgraphRequest } from '../../utils';
import { getProvider } from '../../utils';
import strategies from '..';
import fetch from 'cross-fetch';

export const author = 'kesar';
export const version = '1.0.2';

const defaultGraphs = {
  '56': 'https://api.thegraph.com/subgraphs/name/apyvision/block-info',
  '137': 'https://api.thegraph.com/subgraphs/name/sameepsi/maticblocks',
  '42161':
    'https://api.thegraph.com/subgraphs/name/ianlapham/arbitrum-one-blocks'
};

async function getChainBlockNumber(
  timestamp: number,
  graphURL: string
): Promise<number> {
  const query = {
    blocks: {
      __args: {
        first: 1,
        orderBy: 'number',
        orderDirection: 'desc',
        where: {
          timestamp_lte: timestamp
        }
      },
      number: true,
      timestamp: true
    }
  };
  const data = await subgraphRequest(graphURL, query);
  return Number(data.blocks[0].number);
}

async function getChainBlocksFromSubGraph(
  snapshot,
  provider,
  options,
  network
): Promise<any> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const block = await provider.getBlock(blockTag);
  const chainBlocks = {};
  for (const strategy of options.strategies) {
    if (chainBlocks[strategy.network]) {
      continue;
    }
    if (blockTag === 'latest' || strategy.network === network) {
      chainBlocks[strategy.network] = blockTag;
    } else {
      const graph =
        options.graphs?.[strategy.network] || defaultGraphs[strategy.network];
      chainBlocks[strategy.network] = await getChainBlockNumber(
        block.timestamp,
        graph
      );
    }
  }

  return chainBlocks;
}

async function getChainBlocksFromApi(
  snapshot,
  provider,
  options
): Promise<any> {
  const block = await provider.getBlock(snapshot);
  const timestamp = block.timestamp;

  //Should receive the timestamp as query param and return the block height by chain
  const apiUrl = `${options.blockApi}?timestamp=${timestamp}`;
  const resp = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }).then((r) => r.json());

  //Response should contain blocks object with chainIds as keys and block numbers as values
  return resp.blocks;
}

async function getChainBlocks(
  snapshot,
  provider,
  options,
  network
): Promise<any> {
  if (options.blockApi) {
    return await getChainBlocksFromApi(snapshot, provider, options);
  } else {
    return await getChainBlocksFromSubGraph(
      snapshot,
      provider,
      options,
      network
    );
  }
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const promises: any = [];
  const chainBlocks = await getChainBlocks(
    snapshot,
    provider,
    options,
    network
  );

  for (const strategy of options.strategies) {
    // If snapshot is taken before a network is activated then ignore its strategies
    if (
      options.startBlocks &&
      chainBlocks[strategy.network] < options.startBlocks[strategy.network]
    ) {
      continue;
    }

    promises.push(
      strategies[strategy.name].strategy(
        space,
        strategy.network,
        getProvider(strategy.network),
        addresses,
        strategy.params,
        chainBlocks[strategy.network]
      )
    );
  }
  const results = await Promise.all(promises);
  return results.reduce((finalResults: any, strategyResult: any) => {
    for (const [address, value] of Object.entries(strategyResult)) {
      if (!finalResults[address]) {
        finalResults[address] = 0;
      }

      finalResults[address] += value;
    }

    return finalResults;
  }, {});
}
