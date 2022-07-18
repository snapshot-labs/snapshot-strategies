import { getProvider, getSnapshots } from '../../utils';
import strategies from '..';

export const author = 'sirpy';
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
  const validStrategies = options.strategies
    .filter((s) => s.network === '122' || s.network === '1')
    .slice(0, 2);
  const blocks = await getSnapshots(
    network,
    snapshot,
    provider,
    validStrategies.map((s) => s.network || network)
  );

  for (const strategy of validStrategies) {
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
      finalResults[address] = Math.max(finalResults[address], value as number);
    }
    return finalResults;
  }, {});
}
