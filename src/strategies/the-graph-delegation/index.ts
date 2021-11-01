import { baseStrategy } from '../the-graph/baseStrategy';
import { delegatorsStrategy } from './delegators';

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
    { strategyType: 'delegation', ..._options },
    snapshot,
    delegatorsStrategy
  );
}
