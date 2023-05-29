import {
  getAddressTotalDelegatedScore,
  getDelegationAddresses,
  getLegacyDelegations,
  getPolygonMultiDelegations,
  mergeDelegations,
  reverseDelegations
} from './utils';
import { getScoresDirect } from '../../utils';
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
    delegationSpace,
    network,
    checksummedAddresses,
    snapshot
  );
  const multiDelegationsPromise = getPolygonMultiDelegations(
    network,
    snapshot,
    provider,
    delegationSpace
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
  const delegationAddresses = getDelegationAddresses(reversedDelegations);

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
      return getAddressTotalDelegatedScore(
        delegate,
        reversedDelegations,
        scores
      );
    })
  );
}
