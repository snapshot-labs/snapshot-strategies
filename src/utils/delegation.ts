import { getAddress } from '@ethersproject/address';
import { getDelegatesBySpace } from '../utils';

// Cache object for delegation data
const DELEGATION_DATA_CACHE: Record<string, Record<string, DelegationData>> = {};

// Interface for a single delegation object
interface Delegation {
  delegate: string;  // The address of the delegate
  delegator: string; // The address of the delegator
  space: string;     // The space in which the delegation occurs
}

// Interface for delegation reverse data, containing both delegator and delegate addresses
interface DelegationData {
  delegate: string;
  delegateAddress: string;
  delegator: string;
  delegatorAddress: string;
}

// Function to get delegations for a list of addresses
export async function getDelegations(
  space: string,
  network: string,
  addresses: string[],
  snapshot: string | number
) {
  // Convert all addresses to lowercase for consistent comparison
  const addressesLc = addresses.map((address) => address.toLowerCase());

  // Get delegates by space from the subgraph
  const delegatesBySpace = await getDelegatesBySpace(network, space, snapshot);

  // Filter delegations to include only those where the delegate is in the provided addresses list
  const delegations = delegatesBySpace.filter(
    (delegation: Delegation) =>
      addressesLc.includes(delegation.delegate) && // Check if the delegate is one of the provided addresses
      !addressesLc.includes(delegation.delegator)   // Check that the delegator is not in the list
  );

  // If no delegations are found, return an empty object
  if (delegations.length === 0) return {};

  // Reverse mapping of delegations, storing the delegator as the key and delegate as the value
  const delegationsReverse: Record<string, string> = {};
  delegations.forEach(
    (delegation: Delegation) =>
      (delegationsReverse[delegation.delegator] = delegation.delegate)
  );

  // Filter delegations to include only those with a non-empty space field
  delegations
    .filter((delegation: Delegation) => delegation.space !== '')
    .forEach(
      (delegation: Delegation) =>
        (delegationsReverse[delegation.delegator] = delegation.delegate)
    );

  // Return a mapping of addresses to the corresponding delegators' addresses
  return Object.fromEntries(
    addresses.map((address) => [
      address,
      Object.entries(delegationsReverse)
        .filter(([, delegate]) => address.toLowerCase() === delegate) // Find matching delegate
        .map(([delegator]) => getAddress(delegator)) // Get the delegator's address
    ])
  );
}

// Function to get reverse delegation data (mapping delegate and delegator addresses)
function getDelegationReverseData(delegation: Delegation): DelegationData {
  return {
    delegate: delegation.delegate,
    delegateAddress: getAddress(delegation.delegate),
    delegator: delegation.delegator,
    delegatorAddress: getAddress(delegation.delegator)
  };
}

// Function to get all delegations and delegators data for a space
export async function getDelegationsData(
  space: string,
  network: string,
  addresses: string[],
  snapshot: string | number
) {
  const cacheKey = `${space}-${network}-${snapshot}`;
  let delegationsReverse = DELEGATION_DATA_CACHE[cacheKey];

  // Check if the delegations data is already cached
  if (!delegationsReverse) {
    delegationsReverse = {};

    // Get delegates by space from the subgraph
    const delegatesBySpace = await getDelegatesBySpace(network, space, snapshot);

    // Populate the reverse delegation data
    delegatesBySpace.forEach(
      (delegation: Delegation) =>
        (delegationsReverse[delegation.delegator] =
          getDelegationReverseData(delegation))
    );

    // Filter and populate data for delegations with non-empty space
    delegatesBySpace
      .filter((delegation: Delegation) => delegation.space !== '')
      .forEach(
        (delegation: Delegation) =>
          (delegationsReverse[delegation.delegator] =
            getDelegationReverseData(delegation))
      );

    // Cache data for the 'stgdao.eth' space (only when snapshot is not 'latest')
    if (space === 'stgdao.eth' && snapshot !== 'latest') {
      console.log(`[with-delegation] Caching ${cacheKey}`);
      DELEGATION_DATA_CACHE[cacheKey] = delegationsReverse;
    }
  }

  // Return delegations and all delegators' addresses
  return {
    delegations: Object.fromEntries(
      addresses.map((address) => [
        address,
        Object.values(delegationsReverse)
          .filter((data) => address.toLowerCase() === (data as DelegationData).delegate) // Find matching delegate
          .map((data) => (data as DelegationData).delegatorAddress) // Get the delegator's address
      ])
    ),
    allDelegators: Object.values(delegationsReverse).map(
      (data) => (data as DelegationData).delegatorAddress // Get all delegators' addresses
    )
  };
}
