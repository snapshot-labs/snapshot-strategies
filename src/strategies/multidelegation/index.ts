import {
  getDelegateScore,
  getLegacyDelegations,
  getMultiDelegations,
  mergeDelegations,
  reverseDelegations
} from './utils';
import { getScoresDirect, getSnapshots } from '../../utils';
import { getAddress } from '@ethersproject/address';

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
  const delegationSpace = options.delegationSpace || space;
  const checksummedAddresses = addresses.map(getAddress);

  // Retro compatibility with the legacy delegation strategy
  const legacyDelegationsPromise = getLegacyDelegations(
    'snapshot.dcl.eth',
    network,
    checksummedAddresses,
    snapshot
  );

  const polygonChainId = '80001';
  const blocks = await getSnapshots(network, snapshot, provider, [
    polygonChainId
  ]);
  const polygonBlockNumber = blocks[polygonChainId];

  const multiDelegationsPromise = getMultiDelegations(
    delegationSpace,
    network,
    polygonBlockNumber
  );

  const [legacyDelegations, multiDelegations] = await Promise.all([
    legacyDelegationsPromise,
    multiDelegationsPromise
  ]);

  const isLegacyDelegationEmpty = legacyDelegations.size === 0;
  const isMultiDelegationEmpty = multiDelegations.size === 0;

  if (isLegacyDelegationEmpty && isMultiDelegationEmpty) {
    return Object.fromEntries(
      checksummedAddresses.map((address) => [address, 0])
    );
  }

  const mergedDelegations = mergeDelegations(
    legacyDelegations,
    multiDelegations
  );
  const reversedDelegations = reverseDelegations(mergedDelegations);

  const delegationAddresses = Array.from(reversedDelegations.values()).reduce(
    (accumulator, addresses) => accumulator.concat(addresses),
    []
  );

  const scores = (
    await getScoresDirect(
      space,
      options.strategies,
      network,
      provider,
      delegationAddresses,
      snapshot
    )
  ).filter((score) => Object.keys(score).length !== 0);

  return Object.fromEntries(
    checksummedAddresses.map((delegate) => {
      const delegations = reversedDelegations.get(delegate);
      const delegateScore = delegations
        ? getDelegateScore(delegations, scores)
        : 0;
      return [delegate, delegateScore];
    })
  );
}
