import { formatBytes32String } from '@ethersproject/strings';
import { getAddress, isAddress } from '@ethersproject/address';
import subgraphs from '@snapshot-labs/snapshot.js/src/delegationSubgraphs.json';
import snapshot from '@snapshot-labs/snapshot.js';
import {
  getProvider,
  getSnapshots,
  Multicaller,
  subgraphRequest
} from '../utils';
import _strategies from '../strategies';
import { Score, Snapshot, VotingPower, Protocol } from '../types';
import { DEFAULT_SUPPORTED_PROTOCOLS, VALID_PROTOCOLS } from '../constants';

const DELEGATION_CONTRACT = '0x469788fE6E9E9681C6ebF3bF78e7Fd26Fc015446';
const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';
const EMPTY_SPACE = formatBytes32String('');
const abi = ['function delegation(address, bytes32) view returns (address)'];

// Address format constants
const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const STARKNET_ADDRESS_REGEX = /^0x[a-fA-F0-9]{64}$/;

interface Delegation {
  in: string[];
  out: string | null;
}

export async function getVp(
  address: string,
  network: string,
  strategies: any[],
  snapshot: Snapshot,
  space: string,
  delegation?: boolean
): Promise<VotingPower> {
  validateStrategies(strategies);
  validateVoterAddress(address);

  const networks = [...new Set(strategies.map((s) => s.network || network))];
  const snapshots = await getSnapshots(
    network,
    snapshot,
    getProvider(network),
    networks
  );

  // TODO: Delegation support for Starknet
  const delegationSupported = delegation && isAddress(address);
  const delegations = {};
  if (delegationSupported) {
    const ds = await Promise.all(
      networks.map((n) => getDelegations(address, n, snapshots[n], space))
    );
    ds.forEach((d, i) => (delegations[networks[i]] = d));
  }

  const p: Score[] = strategies.map((strategy) => {
    const n = strategy.network || network;
    let addresses = [address];
    const supportedProtocols = _strategies[strategy.name].supportedProtocols;

    if (delegationSupported && supportedProtocols.includes('evm')) {
      addresses = delegations[n].in;
      if (!delegations[n].out) addresses.push(address);
      addresses = [...new Set(addresses)];
      if (addresses.length === 0) return {};
    }

    addresses = formatSupportedAddresses(addresses, supportedProtocols);

    if (addresses.length === 0) return {};

    return _strategies[strategy.name].strategy(
      space,
      n,
      getProvider(n),
      addresses,
      strategy.params,
      snapshots[n]
    );
  });
  const scores = await Promise.all(p);

  const vpByStrategy = scores.map((score, i) => {
    const n = strategies[i].network || network;
    let addresses = [address];
    const supportedProtocols =
      _strategies[strategies[i].name].supportedProtocols;

    if (delegationSupported && supportedProtocols.includes('evm')) {
      addresses = delegations[n].in;
      if (!delegations[n].out) addresses.push(address);
      addresses = [...new Set(addresses)];
    }

    addresses = formatSupportedAddresses(addresses, supportedProtocols);
    return addresses.reduce((a, b) => a + (score[b] || 0), 0);
  });
  const vp = vpByStrategy.reduce((a, b) => a + b, 0);
  const vpState = snapshot === 'latest' ? 'pending' : 'final';

  return {
    vp,
    vp_by_strategy: vpByStrategy,
    vp_state: vpState
  };
}

export async function getDelegationsOut(
  addresses: string[],
  network: string,
  snapshot: Snapshot,
  space: string
) {
  if (!subgraphs[network])
    return Object.fromEntries(addresses.map((address) => [address, null]));

  const id = formatBytes32String(space);
  const options = { blockTag: snapshot };
  const multi = new Multicaller(network, getProvider(network), abi, options);
  addresses.forEach((account) => {
    multi.call(`${account}.base`, DELEGATION_CONTRACT, 'delegation', [
      account,
      EMPTY_SPACE
    ]);
    multi.call(`${account}.space`, DELEGATION_CONTRACT, 'delegation', [
      account,
      id
    ]);
  });
  const delegations = await multi.execute();

  return Object.fromEntries(
    Object.entries(delegations).map(([address, delegation]: any) => {
      if (delegation.space !== EMPTY_ADDRESS)
        return [address, delegation.space];
      if (delegation.base !== EMPTY_ADDRESS) return [address, delegation.base];
      return [address, null];
    })
  );
}

export async function getDelegationOut(
  address: string,
  network: string,
  snapshot: Snapshot,
  space: string
): Promise<string | null> {
  const usersDelegationOut = await getDelegationsOut(
    [address],
    network,
    snapshot,
    space
  );
  return usersDelegationOut[address] || null;
}

export async function getDelegationsIn(
  address: string,
  network: string,
  snapshot: Snapshot,
  space: string
): Promise<string[]> {
  if (!subgraphs[network]) return [];

  const max = 1000;
  let result = [];
  let page = 0;

  const query = {
    delegations: {
      __args: {
        first: max,
        skip: 0,
        block: { number: snapshot },
        where: {
          space_in: ['', space],
          delegate: address
        }
      },
      delegator: true,
      space: true
    }
  };
  // @ts-ignore
  if (snapshot === 'latest') delete query.delegations.__args.block;
  while (true) {
    query.delegations.__args.skip = page * max;
    const pageResult = await subgraphRequest(subgraphs[network], query);
    const pageDelegations = pageResult.delegations || [];
    result = result.concat(pageDelegations);
    page++;
    if (pageDelegations.length < max) break;
  }

  const delegations: string[] = [];
  let baseDelegations: string[] = [];
  result.forEach((delegation: any) => {
    const delegator = getAddress(delegation.delegator);
    if (delegation.space === space) delegations.push(delegator);
    if ([null, ''].includes(delegation.space)) baseDelegations.push(delegator);
  });

  baseDelegations = baseDelegations.filter(
    (delegator) => !delegations.includes(delegator)
  );
  if (baseDelegations.length > 0) {
    const delegationsOut = await getDelegationsOut(
      baseDelegations,
      network,
      snapshot,
      space
    );
    Object.entries(delegationsOut).map(([delegator, out]: any) => {
      if (out === address) delegations.push(delegator);
    });
  }

  return [...new Set(delegations)];
}

export async function getDelegations(
  address: string,
  network: string,
  snapshot: Snapshot,
  space: string
): Promise<Delegation> {
  const [delegationOut, delegationsIn] = await Promise.all([
    getDelegationOut(address, network, snapshot, space),
    getDelegationsIn(address, network, snapshot, space)
  ]);
  return {
    in: delegationsIn,
    out: delegationOut
  };
}

// Ensure that the address is either a valid EVM address or Starknet address
function validateVoterAddress(address: string): void {
  try {
    const result = formatSupportedAddresses([address], VALID_PROTOCOLS);
    if (!result.length) {
      throw new Error('invalid address');
    }
  } catch {
    throw new Error('invalid address');
  }
}

function validateStrategies(strategies: any[]): void {
  const invalidStrategies = strategies
    .filter((s) => !_strategies[s.name])
    .map((s) => s.name);

  if (invalidStrategies.length > 0) {
    throw new Error(`invalid strategies: ${invalidStrategies.join(', ')}`);
  }
}

/**
 * Validates that protocols are non-empty and contain only valid protocol names.
 *
 * @param protocols - Array of protocol names to validate
 */
function validateProtocols(protocols: Protocol[]): void {
  if (!protocols.length) {
    throw new Error('At least one protocol must be specified');
  }

  const invalidProtocols = protocols.filter(
    (p) => !VALID_PROTOCOLS.includes(p)
  );
  if (invalidProtocols.length > 0) {
    throw new Error(`Invalid protocol(s): ${invalidProtocols.join(', ')}`);
  }
}

/**
 * Formats addresses relevant to the given protocols according to the specified blockchain protocols.
 *
 * Will ignore addresses that are not evm or starknet like addresses
 *
 * @param addresses - Array of blockchain addresses to format
 * @param protocols - Array of protocol names to validate against. Defaults to ['evm'].
 *                   Valid protocols are 'evm' and 'starknet'.
 *
 * @returns Array of formatted addresses in the same order as input
 */
export function formatSupportedAddresses(
  addresses: string[],
  protocols: Protocol[] = DEFAULT_SUPPORTED_PROTOCOLS
): string[] {
  validateProtocols(protocols);

  const supportsEvm = protocols.includes('evm');
  const supportsStarknet = protocols.includes('starknet');

  const getAddressType = (address: string): 'evm' | 'starknet' | null => {
    if (supportsEvm && EVM_ADDRESS_REGEX.test(address)) return 'evm';
    if (supportsStarknet && STARKNET_ADDRESS_REGEX.test(address))
      return 'starknet';
    return null;
  };

  const result: string[] = [];
  for (const address of addresses) {
    const addressType = getAddressType(address);
    if (!addressType) continue; // Skip unsupported addresses

    try {
      const formattedAddress = snapshot.utils.getFormattedAddress(
        address,
        addressType
      );
      result.push(formattedAddress);
    } catch (e) {
      throw new Error(
        `Address "${address}" is not a valid ${protocols.join(' or ')} address`
      );
    }
  }

  return result;
}
