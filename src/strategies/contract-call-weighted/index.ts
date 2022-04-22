import { strategy as contractCallStrategy } from '../contract-call';
export const author = 'rubenwrightus';
export const version = '1.0.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const scores = await contractCallStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );
  return Object.fromEntries(
    Object.entries(scores).map((score) => [score[0], score[1] * options.weight])
  );
}
