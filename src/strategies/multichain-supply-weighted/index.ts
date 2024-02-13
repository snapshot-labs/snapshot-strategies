import { getProvider, getSnapshots } from '../../utils';
import strategies from '..';
import fetch from 'cross-fetch';

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
  const response = await fetch(options.supplyApi, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  const circulatingSupply = data[options.supplyField];
  console.log('Circulating Supply:', circulatingSupply);
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
      const percentOfSupply =
        ((value as number) / circulatingSupply) * options.weight;
      finalResults[address] += percentOfSupply;
    }
    return finalResults;
  }, {});
}
