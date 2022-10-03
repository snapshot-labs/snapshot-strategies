import { getAddress } from '@ethersproject/address';
import strategies from '..';

export const author = 'snapshot-labs';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const { strategies: strategyList, min = 0 } = options;
  // Limit strategyList to 3 strategies
  if (strategyList.length > 3) {
    throw new Error('Too many strategies provided.');
  }
  const promises: any = [];
  for (const strategy of strategyList) {
    promises.push(
      strategies[strategy.name].strategy(
        space,
        network,
        provider,
        addresses,
        strategy.params,
        snapshot
      )
    );
  }

  const results = await Promise.all(promises);
  const scores = {};
  // user has at least min. voting power in any one strategy, return 1 else return 0
  for (const address of addresses) {
    scores[getAddress(address)] = results.reduce((acc, result) => {
      if (!result[address]) return acc;
      if (result[address] > min) {
        return 1;
      }
      return acc;
    }, 0);
  }

  return scores;
}
