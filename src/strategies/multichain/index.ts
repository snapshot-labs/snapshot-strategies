import { subgraphRequest } from '../../utils';
import { getProvider } from '../../utils';
import strategies from '..';

export const author = 'kesar';
export const version = '1.1.0';

async function getBlocks(network, snapshot, provider, options) {
  const blocks = {};
  options.strategies.forEach((s) => (blocks[s.network] = 'latest'));
  if (snapshot === 'latest') return blocks;
  const block = await provider.getBlock(snapshot);
  const query = {
    blocks: {
      __args: {
        where: {
          ts: block.timestamp,
          network_in: Object.keys(blocks).filter((block) => network !== block)
        }
      },
      network: true,
      number: true
    }
  };
  const url = 'https://blockfinder.snapshot.org/graphql';
  const data = await subgraphRequest(url, query);
  data.blocks.forEach((block) => (blocks[block.network] = block.number));
  blocks[network] = snapshot;
  return blocks;
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
  const blocks = await getBlocks(network, snapshot, provider, options);

  for (const strategy of options.strategies) {
    // If snapshot is taken before a network is activated then ignore its strategies
    if (
      options.startBlocks &&
      blocks[strategy.network] < options.startBlocks[strategy.network]
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
        blocks[strategy.network]
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
