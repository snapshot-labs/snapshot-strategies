import { getProvider, getSnapshots } from '../../utils';
import strategies from '..';
import fetch from 'cross-fetch';

export const author = 'divine-comedian';
export const version = '1.2.0';

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
  // this gets the current circulating supply from Github
  const response = await fetch(options.supplyApi, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  const circulatingSupply = data[options.supplyField];
  for (const strategy of options.strategies) {
    // If snapshot is taken before a network is activated then ignore its strategies
    if (
      options.startBlocks &&
      blocks[strategy.network] < options.startBlocks[strategy.network]
    ) {
      continue;
    }
    // this pushed the strategy results to the promises array
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
      // apply the sum of all tokens in strategies against the tokens circulating supply
      // then apply the weight of the strategy to the result and save this as the final result
      const weightedPercentOfSupply =
        ((value as number) / circulatingSupply) * options.weight;
      finalResults[address] += weightedPercentOfSupply;
    }
    return finalResults;
  }, {});
}
