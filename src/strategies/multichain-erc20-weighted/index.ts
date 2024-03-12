import { getProvider, getSnapshots } from '../../utils';
import strategies from '..';

export const author = 'kesar';
export const version = '1.1.0';

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
  for (const tokenPool of options.tokenPools) {
    const tokenPromises: any = [];
    for (const strategy of tokenPool.strategies) {
      // If snapshot is taken before a network is activated then ignore its strategies
      if (
        options.startBlocks &&
        blocks[strategy.network] < options.startBlocks[strategy.network]
      ) {
        continue;
      }

      tokenPromises.push(
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
    promises.push(tokenPromises);
  }

  const results = await Promise.all(promises);
  const summedResults = results.map((result: any) =>
    result.reduce((sum, value) => sum + value, 0)
  );
  const weightedResults = summedResults.map(
    (result, index) => result * options.tokenPools[index].weight
  );

  console.log(weightedResults, 'weightedResults');
  return weightedResults.reduce((finalResults: any, strategyResult: any) => {
    for (const [address, value] of Object.entries(strategyResult)) {
      if (!finalResults[address]) {
        finalResults[address] = 0;
      }
      finalResults[address] += value;
    }
    return finalResults;
  }, {});
}
