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
export const version = '0.1.0';

// TODO: Test MAYC
// TODO: See if schema is needed and test
// TODO: Check strategy symbol test
// TODO: Add README

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // Get the wallet mapping from delegate wallets to cold wallets
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

  const linkedDelegations: DelegatedMapping = {};

  addresses.map((address: Address) => {
    linkedDelegations[lowerCaseAddress(address)] = [];
  });

  // format this mapping from the results of the multicall to getIncomingDelegations
  if (response.length) {
    response.map((data: DelegationStruct) => {
      data.delegations_.map((delegation: Delegation) => {
        const { to, from, type_, contract_ } = delegation;

        if (type_ === DelegationType.ALL) {
          linkedDelegations[lowerCaseAddress(to)].push(from);
        }

        if (type_ === DelegationType.CONTRACT) {
          if (contract_ !== options.address) return;
          if (linkedDelegations[lowerCaseAddress(to)].includes(from)) return;

          linkedDelegations[lowerCaseAddress(to)].push(from);
        }
      });
    });
  }

  // Flatten mapped wallets so we can check vault wallets directly
  const delegateWallets: Address[] = Object.keys(linkedDelegations).map(
    (key) => linkedDelegations[key]
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

  // Sum voting power of vault wallet(s) and map it back to delegate wallet
  return calculateVotingPower(addresses, addressScores, linkedDelegations);
}
