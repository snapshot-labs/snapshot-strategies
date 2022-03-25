import { formatUnits } from '@ethersproject/units';
import { getProvider, Multicaller } from '../../utils';
import { getSnapshots } from '../../utils/blockfinder';
import strategies from '..';

export const author = 'brightiron';
export const version = '0.0.1';

const abi = ['function index() public view returns (uint256)'];
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
        strategy.params,
        blocks[strategy.network]
      )
    );
  }
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const multi = new Multicaller(network, provider, abi, { blockTag });
  multi.call('index', options.indexAddress, 'index');
  const indexResult = await multi.execute();
  const index = parseFloat(
    formatUnits(indexResult.index, options.indexDecimals)
  );

  const results = await Promise.all(promises);
  return results.reduce((finalResults: any, strategyResult: any) => {
    for (const [address, value] of Object.entries(strategyResult)) {
      if (!finalResults[address]) {
        finalResults[address] = 0;
      }
      finalResults[address] += value as number * index;
    }
    return finalResults;
  }, {});
}
