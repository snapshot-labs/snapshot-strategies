import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { strategy as dssVestUnpaidStrategy } from '../dss-vest-unpaid';

export const author = 'espendk';
export const version = '1.0.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const score = await dssVestUnpaidStrategy(
    space,
    network,
    provider,
    addresses,
    { address: options.dssVestAddress, ...options },
    snapshot
  );
  const mgvScore = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    { address: options.tokenAddress, ...options },
    snapshot
  );

  for (const address of Object.keys(score)) {
    score[address] += mgvScore[address];
  }

  return score;
}
