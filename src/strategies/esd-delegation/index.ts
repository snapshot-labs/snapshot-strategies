import { strategy as esd } from '../esd';
import { getDelegations } from '../../utils/delegation';

export const author = 'l3wi';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const delegations = await getDelegations(space, network, addresses, snapshot);
  if (Object.keys(delegations).length === 0) return {};

  const score = await esd(
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
