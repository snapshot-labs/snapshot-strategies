import { formatUnits } from '@ethersproject/units';
import { isAddress } from '@ethersproject/address';
import { multicall } from '../../utils';
import { getDelegations } from '../../utils/delegation';

export const author = 'serenae-fansubs';
export const version = '0.1.0';

const getVotesName = 'getVotes';
const getVotesABI = [
  'function getVotes(address account) view returns (uint256)'
];
const balanceOfName = 'balanceOf';
const balanceOfABI = [
  'function balanceOf(address account) view returns (uint256)'
];
const delegatesName = 'delegates';
const delegatesABI = [
  'function delegates(address account) view returns (address)'
];

/*
  Counts votes from delegates, and also from individual delegators who wish
  to override the vote of their delegate.

  Makes three multicalls for votes, delegates, and balances.

  If an account has any delegated voting power returned from getVotes,
  adds that value, minus the balances from any delegators that have also
  individually voted.

  If an account is delegating to itself, then its own token balance will
  already be included in the getVotes return value.

  If an account is delegating to a different valid address, adds the local
  token balance. The account must be delegated to another valid address,
  otherwise the local token balance will not be added.

  The function names/ABI can be overridden in the options.

  If the "includeSnapshotDelegations" option is enabled, then one additional
  request will be made to retrieve Snapshot delegations from the subgraph.
  In this case, the "isSnapshotDelegatedScore" option will determine whether
  the delegated or non-delegated scores will be returned. This is done
  because the overridden voting power calculation is not compatible with the
  standard "delegation" strategy. So instead, space admins can use this
  strategy twice, each with "includeSnapshotDelegations" enabled and the
  "isSnapshotDelegatedScore" enabled or disabled.
*/
export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const addressesLc = addresses.map((address: any) => lowerCase(address));

  const includeSnapshotDelegations = !!options.includeSnapshotDelegations;
  const isSnapshotDelegatedScore =
    includeSnapshotDelegations && !!options.isSnapshotDelegatedScore;

  // If enabled, get Snapshot delegations. This will not include any delegators that are already in the addresses list.
  const snapshotDelegations = includeSnapshotDelegations
    ? await getDelegations(
        options.delegationSpace || space,
        network,
        addressesLc,
        snapshot
      )
    : {};
  if (Object.keys(snapshotDelegations).length > 0) {
    /*
      If any Snapshot delegations were retrieved, add the delegators to the addresses list.
      
      The on-chain delegations, balances, and overridden voting power will be retrieved and
      calculated with all these addresses present.
    */
    Object.entries(snapshotDelegations).forEach(([, delegators]) =>
      delegators.forEach((delegator: string) =>
        addressesLc.push(lowerCase(delegator))
      )
    );
  }

  const delegatesResponse = await multicall(
    network,
    provider,
    options.delegatesABI || delegatesABI,
    addressesLc.map((address: any) => [
      options.address,
      options.delegatesName || delegatesName,
      [address]
    ]),
    { blockTag }
  );
  const delegators = Object.fromEntries(
    delegatesResponse
      .map((value: any, i: number) => [
        addressesLc[i],
        lowerCase(getFirst(value))
      ])
      .filter(([, delegate]) => isValidAddress(delegate))
  );

  /*
    Create reverse map from delegate to [delegators].
    The delegate itself will not be included in the delegators list.
  */
  const delegates = Object.fromEntries(
    addressesLc.map((address: string) => [
      address,
      Object.entries(delegators)
        .filter(
          ([delegator, delegate]) =>
            address === delegate && delegator !== delegate
        )
        .map(([delegator]) => delegator)
    ])
  );

  const balanceOfResponse = await multicall(
    network,
    provider,
    options.balanceOfABI || balanceOfABI,
    addressesLc.map((address: any) => [
      options.address,
      options.balanceOfName || balanceOfName,
      [address]
    ]),
    { blockTag }
  );
  const balances = Object.fromEntries(
    balanceOfResponse.map((value: any, i: number) => [
      addressesLc[i],
      parseValue(value, options.decimals)
    ])
  );

  const getVotesResponse = await multicall(
    network,
    provider,
    options.getVotesABI || getVotesABI,
    addressesLc.map((address: any) => [
      options.address,
      options.getVotesName || getVotesName,
      [address]
    ]),
    { blockTag }
  );
  // Calculate overridden voting power for all addresses, including the added delegators
  const votes = Object.fromEntries(
    getVotesResponse.map((value: any, i: number) => [
      addressesLc[i],
      getVotesWithOverride(
        addressesLc[i],
        parseValue(value, options.decimals),
        delegators,
        delegates,
        balances
      )
    ])
  );

  // Only return scores for the original address list
  return Object.fromEntries(
    addresses.map((address: any) => [
      address,
      getScore(
        isSnapshotDelegatedScore,
        lowerCase(address),
        votes,
        snapshotDelegations
      )
    ])
  );
}

function getScore(
  isSnapshotDelegatedScore: boolean,
  address: string,
  votes: Record<string, number>,
  snapshotDelegations: Record<string, Array<string>>
): number {
  /*
    If the Snapshot delegated score is being used, defer to that method to calculate it.
    Otherwise, just return the voting power calculated before.
  */
  if (isSnapshotDelegatedScore) {
    return getSnapshotDelegatedScore(address, votes, snapshotDelegations);
  } else {
    return votes[address];
  }
}

function getSnapshotDelegatedScore(
  address: string,
  votes: Record<string, number>,
  snapshotDelegations: Record<string, Array<string>>
): number {
  const delegatedScore = { score: 0 };

  // Sum up the voting power from all accounts that have delegated to this address via Snapshot
  const snapshotDelegators = snapshotDelegations[address];
  if (snapshotDelegators) {
    snapshotDelegators.forEach(
      (delegator: string) =>
        (delegatedScore.score += votes[lowerCase(delegator)])
    );
  }

  return delegatedScore.score;
}

function getVotesWithOverride(
  address: string,
  votes: number,
  delegators: Record<string, string>,
  delegates: Record<string, Array<string>>,
  balances: Record<string, number>
): number {
  const adjustedVotes = { votes };

  if (votes > 0) {
    // Subtract any overridden votes
    delegates[address].forEach(
      (delegator: string) => (adjustedVotes.votes -= balances[delegator])
    );

    /* 
      This should never happen because the OpenZeppelin getVotes method
      returns the aggregated balances from all delegators.

      However, still checking just in case a different contract is used.
    */
    if (adjustedVotes.votes < 0) {
      adjustedVotes.votes = 0;
    }
  }

  if (isValidAddress(delegators[address]) && address !== delegators[address]) {
    // Delegating to someone else, so add the local balance
    adjustedVotes.votes += balances[address];
  }

  return adjustedVotes.votes;
}

function parseValue(value: any, decimals: number): number {
  return parseFloat(formatUnits(value.toString(), decimals));
}

function getFirst(value: any): any {
  if (Array.isArray(value)) {
    return value.length > 0 ? value[0] : null;
  }
  return value;
}

function lowerCase(value: any): any {
  return value ? value.toLowerCase() : value;
}

function isValidAddress(address: string): boolean {
  return (
    isAddress(address) &&
    address != '0x0000000000000000000000000000000000000000'
  );
}
