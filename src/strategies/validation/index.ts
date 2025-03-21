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
  const {
    validationStrategies = [],
    votingStrategies = [],
    validationThreshold = 1
  } = options;
  // Limit validationStrategies to 3 strategies
  if (validationStrategies.length === 0 || votingStrategies.length === 0) {
    throw new Error('No validation strategies provided.');
  }
  if (validationStrategies.length > 3 || votingStrategies.length > 3) {
    throw new Error('Too many strategies provided.');
  }

  const promises: any = [];
  for (const strategy of validationStrategies) {
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
  let validatedAddresses: string[] = [];
  results.forEach((result) => {
    for (const address in result) {
      if (result[address] >= validationThreshold) {
        validatedAddresses.push(getAddress(address));
      }
    }
  });
  validatedAddresses = [...new Set(validatedAddresses)];

  const scores = {};
  if (validatedAddresses.length > 0) {
    const promises: any = [];
    for (const strategy of votingStrategies) {
      promises.push(
        strategies[strategy.name].strategy(
          space,
          network,
          provider,
          validatedAddresses,
          strategy.params,
          snapshot
        )
      );
    }

    const results = await Promise.all(promises);
    results.forEach((result) => {
      for (const address in result) {
        if (!scores[address]) scores[address] = 0;
        scores[address] += result[address];
      }
    });
  }

  return scores;
}
