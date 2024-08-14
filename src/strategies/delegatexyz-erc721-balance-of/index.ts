import { multicall } from '../../utils';
import { strategy as erc721BalanceOfStrategy } from '../erc721';
import { abi, delegatexyzV2ContractAddress } from './constants';
import { lowerCaseAddress, calculateVotingPower } from './utils';
import {
  Address,
  DelegationType,
  Delegation,
  DelegationStruct,
  DelegatedMapping,
  AddressScore
} from './types';

export const author = 'apesplus';
export const version = '0.1.1';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const mappedDelegations: DelegatedMapping = {};
  const delegators: Address[] = [];
  const allowlist: Address[] = [];

  // Use the provided addresses as the keys for our mapping
  addresses.map((address: Address) => {
    mappedDelegations[lowerCaseAddress(address)] = [];
  });

  // Get the wallet mapping from delegate wallets to vault wallets
  const response = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: Address) => [
      delegatexyzV2ContractAddress,
      'getIncomingDelegations',
      [address]
    ]),
    { blockTag }
  );

  // build a list of delegators (from addresses) so we can check
  // outgoing delegations
  response.forEach((data: DelegationStruct) => {
    data.delegations_.forEach((delegation: Delegation) => {
      if (!delegators.includes(delegation.from)) {
        delegators.push(delegation.from);
      }
    });
  });

  // check outgoing delegations for each delegator
  const outgoing = await multicall(
    network,
    provider,
    abi,
    delegators.map((address: Address) => [
      delegatexyzV2ContractAddress,
      'getOutgoingDelegations',
      [address]
    ]),
    { blockTag }
  );

  outgoing.forEach((data: DelegationStruct) => {
    const latest: Delegation = data.delegations_.slice(-1)[0];
    // whitelist the most recent outgoing delegation (to) address
    // to prevent users from voting multiple times for each asset
    // stored in the vault
    if (!allowlist.includes(latest.to)) {
      allowlist.push(latest.to);
    }
  });

  // complete the mapping from the results of
  // the multicall to getIncomingDelegations
  if (response.length) {
    response.forEach((data: DelegationStruct) => {
      data.delegations_.forEach((delegation: Delegation) => {
        const { to, from, type_, contract_ } = delegation;

        // Check for full wallet delegation first and
        // add the vault to the mapping
        if (type_ === DelegationType.ALL && allowlist.includes(to)) {
          mappedDelegations[lowerCaseAddress(to)].push(from);
        }

        // Check for contract level delegation and add
        // to the mapping if contract is correct and the
        // vault address is not already mapped
        if (type_ === DelegationType.CONTRACT && allowlist.includes(to)) {
          if (contract_ !== options.address) return;
          if (mappedDelegations[lowerCaseAddress(to)].includes(from)) return;

          mappedDelegations[lowerCaseAddress(to)].push(from);
        }
      });
    });
  }

  // Flatten mapped wallets so we can check vault wallets directly
  const delegateWallets: Address[] = Object.keys(mappedDelegations).map(
    (key) => mappedDelegations[key]
  );

  const flattenedAddresses: Address[] = ([] as Address[]).concat.apply(
    [],
    delegateWallets
  );

  // Check balance of vault wallets
  const addressScores: AddressScore = await erc721BalanceOfStrategy(
    space,
    network,
    provider,
    flattenedAddresses,
    options,
    snapshot
  );

  // Sum voting power of vault wallets and map the score back to delegate wallet
  return calculateVotingPower(addresses, addressScores, mappedDelegations);
}
