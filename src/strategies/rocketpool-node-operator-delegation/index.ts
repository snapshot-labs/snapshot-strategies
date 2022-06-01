import { strategy as rocketPoolNodeOperatorStrategy } from '../rocketpool-node-operator';
import { getDelegations } from '../../utils/delegation';

export const author = 'rocket-pool';
export const version = '0.1.1';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const delegationSpace = options.delegationSpace || space;
  const delegations = await getDelegations(
    delegationSpace,
    network,
    addresses,
    snapshot
  );
  if (Object.keys(delegations).length === 0) return {};

  const score = await rocketPoolNodeOperatorStrategy(
    space,
    network,
    provider,
    Object.values(delegations).reduce((a: string[], b: string[]) =>
      a.concat(b)
    ),
    options,
    snapshot
  );

  return Object.fromEntries(
    addresses.map((address) => {
      const addressScore = delegations[address]
        ? delegations[address].reduce((a, b) => a + score[b], 0)
        : 0;
      return [address, addressScore];
    })
  );
}
