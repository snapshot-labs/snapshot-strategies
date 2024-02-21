import { call } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'divine-comedian';
export const version = '1.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const totalSupply = await call(
    provider,
    [options.methodABI],
    [options.address, options.methodABI.name],
    { blockTag }
  );

  const scores = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );
  return Object.fromEntries(
    Object.entries(scores).map((score) => [
      score[0],
      (score[1] / totalSupply) * options.weight
    ])
  );
}
