import { getScoresDirect } from '../../utils';
import { strategy as legacyDelegationStrategy } from '../delegation';
import { getMultiDelegations } from './utils';

export const author = 'dcl-DAO';
export const version = '0.1.0';
export const dependOnOtherAddress = true;

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  // Retro compatibility with the legacy delegation strategy
  const legacyDelegationsPromise = legacyDelegationStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  const delegationSpace = options.delegationSpace || space;
  const multiDelegationsPromise = getMultiDelegations(
    delegationSpace,
    network,
    addresses,
    snapshot
  );

  const [legacyDelegations, multiDelegations] = await Promise.all([
    legacyDelegationsPromise,
    multiDelegationsPromise
  ]);

  const isLegacyDelegationEmpty = Object.keys(legacyDelegations).length === 0;
  const isMultiDelegationEmpty = Object.keys(multiDelegations).length === 0;

  if (isLegacyDelegationEmpty && isMultiDelegationEmpty) return {};

  if (isMultiDelegationEmpty) return legacyDelegations;

  // TODO: check if getScoresDirect can be called with multiDelegations
  const scores = (
    await getScoresDirect(
      space,
      options.strategies,
      network,
      provider,
      Object.values(multiDelegations).reduce((a: string[], b: string[]) =>
        a.concat(b)
      ),
      snapshot
    )
  ).filter((score) => Object.keys(score).length !== 0);

  return Object.fromEntries(
    addresses.map((address) => {
      const addressScore =
        legacyDelegations[address] ||
        (multiDelegations[address]
          ? multiDelegations[address].reduce(
              (a, b) => a + scores.reduce((x, y) => (y[b] ? x + y[b] : x), 0),
              0
            )
          : 0);
      return [address, addressScore];
    })
  );
}
