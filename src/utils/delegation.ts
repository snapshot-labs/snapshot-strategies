import { getAddress } from '@ethersproject/address';
import { getDelegatesBySpace } from '../utils';

const DELEGATION_DATA_CACHE = {};

// delegations with overrides
export async function getDelegations(space, network, addresses, snapshot) {
  const addressesLc = addresses.map((addresses) => addresses.toLowerCase());
  const delegatesBySpace = await getDelegatesBySpace(network, space, snapshot);

  const delegations = delegatesBySpace.filter(
    (delegation: any) =>
      addressesLc.includes(delegation.delegate) &&
      !addressesLc.includes(delegation.delegator)
  );
  if (!delegations) return {};

  const delegationsReverse = {};
  delegations.forEach(
    (delegation: any) =>
      (delegationsReverse[delegation.delegator] = delegation.delegate)
  );
  delegations
    .filter((delegation: any) => delegation.space !== '')
    .forEach(
      (delegation: any) =>
        (delegationsReverse[delegation.delegator] = delegation.delegate)
    );

  return Object.fromEntries(
    addresses.map((address) => [
      address,
      Object.entries(delegationsReverse)
        .filter(([, delegate]) => address.toLowerCase() === delegate)
        .map(([delegator]) => getAddress(delegator))
    ])
  );
}

export async function getDelegationsData(space, network, addresses, snapshot) {
  const delegatesBySpace = await getDelegatesBySpace(network, space, snapshot);

  const cacheKey = `${space}-${network}-${snapshot}`;
  const cacheEntry = DELEGATION_DATA_CACHE[cacheKey];

  let delegationsReverse =
    cacheEntry && cacheEntry.expireAt > Date.now() ? cacheEntry.data : null;

  if (!delegationsReverse) {
    delegationsReverse = {};
    delegatesBySpace.forEach((delegation: any) => {
      delegationsReverse[delegation.delegator] = {
        delegate: delegation.delegate,
        delegateAddress: getAddress(delegation.delegate),
        delegator: delegation.delegator,
        delegatorAddress: getAddress(delegation.delegator)
      };
    });

    if (space === 'stgdao.eth') {
      // we only cache stgdao for now
      DELEGATION_DATA_CACHE[cacheKey] = {
        data: delegationsReverse,
        expireAt: Date.now() + 1000 * 60 * 5 // 5 minutes
      };
    }
  }

  return {
    delegations: Object.fromEntries(
      addresses.map((address) => [
        address,
        Object.values(delegationsReverse)
          .filter((data) => address.toLowerCase() === (data as any).delegate)
          .map((data) => (data as any).delegatorAddress)
      ])
    ),
    allDelegators: Object.values(delegationsReverse).map(
      (data) => (data as any).delegatorAddress
    )
  };
}
