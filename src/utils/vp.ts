import { formatBytes32String } from '@ethersproject/strings';
import { getAddress } from '@ethersproject/address';
import {
  getProvider,
  getSnapshots,
  Multicaller,
  subgraphRequest
} from '../utils';
import _strategies from '../strategies';
import subgraphs from '@snapshot-labs/snapshot.js/src/delegationSubgraphs.json';

const DELEGATION_CONTRACT = '0x469788fE6E9E9681C6ebF3bF78e7Fd26Fc015446';
const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';
const EMPTY_SPACE = formatBytes32String('');
const abi = ['function delegation(address, bytes32) view returns (address)'];

interface Delegation {
  in: string[];
  out: string | null;
}

export async function getVp(
  address: string,
  network: string,
  strategies: any[],
  snapshot: number | 'latest',
  space: string,
  delegation: boolean
) {
  const networks = [...new Set(strategies.map((s) => s.network || network))];
  const snapshots = await getSnapshots(
    network,
    snapshot,
    getProvider(network),
    networks
  );

  const delegations = {};
  if (delegation) {
    const ds = await Promise.all(
      networks.map((n) => getDelegations(address, n, snapshots[n], space))
    );
    ds.forEach((d, i) => (delegations[networks[i]] = d));
  }

  const p = strategies.map((strategy) => {
    const n = strategy.network || network;
    let addresses = [address];

    if (delegation) {
      addresses = delegations[n].in;
      if (!delegations[n].out) addresses.push(address);
      addresses = [...new Set(addresses)];
      if (addresses.length === 0) return {};
    }

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

    if (delegation) {
      addresses = delegations[n].in;
      if (!delegations[n].out) addresses.push(address);
      addresses = [...new Set(addresses)];
    }

    return addresses.reduce((a, b) => a + (score[b] || 0), 0);
  });
  const vp = vpByStrategy.reduce((a, b) => a + b, 0);
  let vpState = 'final';
  if (snapshot === 'latest') vpState = 'pending';

  return {
    vp,
    vp_by_strategy: vpByStrategy,
    vp_state: vpState
  };
}

export async function getDelegationsOut(
  addresses: string[],
  network: string,
  snapshot: number | 'latest',
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
  snapshot: number | 'latest',
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
  snapshot: number | 'latest',
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
  snapshot: number | 'latest',
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
