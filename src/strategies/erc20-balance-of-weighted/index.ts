import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'Tanz0rz';
export const version = '1.0.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const scores = await erc20BalanceOfStrategy(
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
