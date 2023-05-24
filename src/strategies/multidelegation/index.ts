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
    checksummedAddresses,
    polygonBlockNumber
  );

  const [legacyDelegations, multiDelegations] = await Promise.all([
    legacyDelegationsPromise,
    multiDelegationsPromise
  ]);
  console.log('legacyDelegations', legacyDelegations);
  console.log('multiDelegations', multiDelegations);

  const isLegacyDelegationEmpty = legacyDelegations.size === 0;
  const isMultiDelegationEmpty = multiDelegations.size === 0;

  if (isLegacyDelegationEmpty && isMultiDelegationEmpty) return {};

  const mergedDelegations = mergeDelegations(
    legacyDelegations,
    multiDelegations
  );

  console.log('mergedDelegations', mergedDelegations);

  const reversedDelegations = reverseDelegations(mergedDelegations);
  console.log('reversedDelegations', reversedDelegations);

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

  console.log('scores', scores);

  return Object.fromEntries(
    addresses.map((delegate) => {
      const delegations = reversedDelegations.get(delegate);
      const delegateScore = delegations
        ? getDelegateScore(delegations, scores)
        : 0;
      return [delegate, delegateScore];
    })
  );
}
