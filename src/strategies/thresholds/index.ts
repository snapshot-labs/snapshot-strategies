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
  const thresholds = options.thresholds || [{ threshold: 1, votes: 1 }];
  if (thresholds.length == 0) thresholds.push({ threshold: 1, votes: 1 });

  const calculateVotes = (balance) =>
    thresholds
      .sort((a, b) => b.threshold - a.threshold)
      .find((t) => t.threshold <= balance)?.votes ?? 0;

  const response = await strategies[options.strategy.name].strategy(
    space,
    network,
    provider,
    addresses,
    options.strategy.params,
    snapshot
  );

  return Object.fromEntries(
    Object.keys(response).map((address) => [
      address,
      calculateVotes(response[address])
    ])
  );
}
