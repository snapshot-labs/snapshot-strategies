import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'Alongside-Finance';
export const version = '1.0.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const balance = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  return Object.fromEntries(
    addresses.map((address) => [address, Math.sqrt(balance[address] || 0)])
  );
}
