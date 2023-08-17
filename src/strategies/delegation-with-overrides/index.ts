import { getDelegations } from '../../utils/delegation';
import { getScoresDirect } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = '0xbutterfield';
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
  const delegationSpace = options.delegationSpace || space;
  const overrides: { [delegatee: string]: string } = Object.fromEntries(
    Object.entries(options.overrides ?? {}).map(([key, value]) => [
      getAddress(key),
      getAddress(value as string)
    ])
  );

  // Remove duplicates
  const allAddresses = addresses
    .concat(Object.keys(overrides))
    .filter((v, i, a) => a.indexOf(v) === i);

  const delegations = await getDelegations(
    delegationSpace,
    network,
    allAddresses,
    snapshot
  );
  if (Object.keys(delegations).length === 0) return {};

  const scores = (
    await getScoresDirect(
      space,
      options.strategies,
      network,
      provider,
      Object.values(delegations).reduce((a: string[], b: string[]) =>
        a.concat(b)
      ),
      snapshot
    )
  ).filter((score) => Object.keys(score).length !== 0);

  return allAddresses
    .map((address) => {
      const addressScore = delegations[address]
        ? delegations[address].reduce(
            (a, b) => a + scores.reduce((x, y) => (y[b] ? x + y[b] : x), 0),
            0
          )
        : 0;
      return [address, addressScore];
    })
    .reduce((acc, [address, addressScore]) => {
      const delegatee = overrides[address];
      if (delegatee) {
        return {
          ...acc,
          // Redirect the votes for address to delegatee
          [address]: 0,
          [delegatee]: (acc[delegatee] ?? 0) + addressScore
        };
      }
      // It is possible that address has already been set with an override,
      // so add the score to that value (or zero)
      return { ...acc, [address]: (acc[address] ?? 0) + addressScore };
    }, {});
}
