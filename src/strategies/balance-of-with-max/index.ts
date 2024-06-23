import { getAddress } from '@ethersproject/address';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'thomasscovell';
export const version = '0.1.1';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const score = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  Object.keys(score).forEach((key) => {
    if (score[key] * options.weight <= (options.maxBalance || 0))
      score[key] = score[key] * options.weight;
    else score[key] = options.maxBalance;
  });

  return Object.fromEntries(
    Object.entries(score).map(([address, balance]) => [
      getAddress(address),
      balance
    ])
  );
}
