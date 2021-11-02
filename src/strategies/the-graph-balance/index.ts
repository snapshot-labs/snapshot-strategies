import { baseStrategy } from '../the-graph/baseStrategy';
import { balanceStrategy } from './balances';

export const author = 'glmaljkovich';
export const version = '1.0.1';

export async function strategy(
  _space,
  network,
  _provider,
  addresses,
  _options,
  snapshot
) {
  return await baseStrategy(
    _space,
    network,
    _provider,
    addresses,
    { strategyType: 'balance', ..._options },
    snapshot,
    balanceStrategy
  );
}
