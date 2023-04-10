import { getAddress } from '@ethersproject/address';
import { getDelegationsData } from '../../utils/delegation';
import { getScoresDirect, getSnapshots } from '../../utils';

export const author = 'snapshot-labs';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  addresses = addresses.map(getAddress);
  const delegationSpace = options.delegationSpace || space;
  const delegationNetwork = options.delegationNetwork || network;
  let delegationSnapshot = snapshot;
  if (delegationNetwork !== network) {
    const snapshots = await getSnapshots(network, snapshot, provider, [
      delegationNetwork
    ]);
    delegationSnapshot = snapshots[delegationNetwork];
  }

  const delegationsData = await getDelegationsData(
    delegationSpace,
    delegationNetwork,
    addresses,
    delegationSnapshot
  );
  const delegations = delegationsData.delegations;

  // Get scores for all addresses and delegators
  if (Object.keys(delegations).length === 0) return {};
  const allAddresses = Object.values(delegations).reduce(
    (a: string[], b: string[]) => a.concat(b),
    []
  );
  allAddresses.push(...addresses);
  const scores = (
    await getScoresDirect(
      space,
      options.strategies,
      network,
      provider,
      allAddresses,
      snapshot
    )
  ).filter((score) => Object.keys(score).length !== 0);

  const finalScore = Object.fromEntries(
    addresses.map((address) => {
      const addressScore = delegations[address]
        ? delegations[address].reduce(
            (a, b) => a + scores.reduce((x, y) => (y[b] ? x + y[b] : x), 0),
            0
          )
        : 0;
      return [address, addressScore];
    })
  );

  // Add own scores if not delegated to anyone
  addresses.forEach((address) => {
    if (!delegationsData.allDelegators.includes(address)) {
      finalScore[address] += scores.reduce(
        (a, b) => a + (b[address] ? b[address] : 0),
        0
      );
    }
  });

  return finalScore;
}
