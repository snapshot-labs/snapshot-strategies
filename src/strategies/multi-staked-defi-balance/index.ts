// src/strategies/multi-staked-defi-balance/index.ts

import { getProvider, getSnapshots } from '../../utils';
import strategies from '..';

export const author = 'taha-abbasi';
export const version = '1.0.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const promises: any = [];
  const blocks = await getSnapshots(
    network,
    snapshot,
    provider,
    options.strategies.map((s) => s.network || network)
  );

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
        [strategy.params],
        blocks[strategy.network]
      )
    );
  }

  const results = await Promise.all(promises);
  const aggregatedResults = results.reduce((finalResults: any, strategyResult: any) => {
    for (const [address, value] of Object.entries(strategyResult)) {
      if (!finalResults[address]) {
        finalResults[address] = 0;
      }
      finalResults[address] += value;
    }
    return finalResults;
  }, {});

  // Filter results based on the cumulativeMinimumStakedBalance
  const filteredResults = {};
  for (const [address, value] of Object.entries(aggregatedResults)) {
    if ((value as number) >= options.cumulativeMinimumStakedBalance) {
      filteredResults[address] = value;
    }
  }

  return filteredResults;
}
