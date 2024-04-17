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

function getDelegationReverseData(delegation) {
  return {
    delegate: delegation.delegate,
    delegateAddress: getAddress(delegation.delegate),
    delegator: delegation.delegator,
    delegatorAddress: getAddress(delegation.delegator)
  };
}

export async function getDelegationsData(space, network, addresses, snapshot) {
  const cacheKey = `${space}-${network}-${snapshot}`;
  let delegationsReverse = DELEGATION_DATA_CACHE[cacheKey];

  if (!delegationsReverse) {
    delegationsReverse = {};

    const delegatesBySpace = await getDelegatesBySpace(
      network,
      space,
      snapshot
    );

    delegatesBySpace.forEach(
      (delegation: any) =>
        (delegationsReverse[delegation.delegator] =
          getDelegationReverseData(delegation))
    );
    delegatesBySpace
      .filter((delegation: any) => delegation.space !== '')
      .forEach(
        (delegation: any) =>
          (delegationsReverse[delegation.delegator] =
            getDelegationReverseData(delegation))
      );

    if (space === 'stgdao.eth' && snapshot !== 'latest') {
      // TODO: implement LRU so memory doesn't explode
      // we only cache stgdao for now
      console.log(`[with-delegation] Caching ${cacheKey}`);
      DELEGATION_DATA_CACHE[cacheKey] = delegationsReverse;
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
