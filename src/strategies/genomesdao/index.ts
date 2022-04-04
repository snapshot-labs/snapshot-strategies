import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
export const author = 'Charles-repo';
export const version = '0.1.2';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const result = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  return result;
}
