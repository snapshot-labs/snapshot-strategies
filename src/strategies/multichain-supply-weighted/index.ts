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
  const blocksPromise = getSnapshots(
    network,
    snapshot,
    provider,
    options.strategies.map((s) => s.network || network)
  );
  const responsePromise = fetch(options.supplyApi, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });

  const [blocks, response] = await Promise.all([
    blocksPromise,
    responsePromise
  ]);

  const data = await response.json();
  const circulatingSupply = data[options.supplyField];

  const promises: any = [];
  for (const strategy of options.strategies) {
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
  console.log(results, 'results');
  const finalResults: any = new Map(addresses.map((address) => [address, 0]));

  for (const strategyResult of results) {
    for (const [address, value] of Object.entries(strategyResult)) {
      const weightedPercentOfSupply =
        ((value as number) / circulatingSupply) * options.weight;
      finalResults.set(
        address,
        finalResults.get(address) + weightedPercentOfSupply
      );
    }
  }

  return Object.fromEntries(finalResults);
}
