import { formatUnits } from '@ethersproject/units';
import { isAddress } from '@ethersproject/address';
import { multicall } from '../../utils';

export const author = 'serenae-fansubs';
export const version = '0.1.0';

const getVotesName = "getVotes";
const getVotesABI = ["function getVotes(address account) view returns (uint256)"];
const balanceOfName = "balanceOf";
const balanceOfABI = ["function balanceOf(address account) view returns (uint256)"];
const delegatesName = "delegates";
const delegatesABI = ["function delegates(address account) view returns (address)"];

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
  const delegators = Object.fromEntries(delegatesResponse
    .map((value: any, i: number) => [
      addressesLc[i],
      lowerCase(getFirst(value))])
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
        .filter(([delegator, delegate]) => address === delegate && delegator !== delegate)
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
  const balances = Object.fromEntries(balanceOfResponse.map((value: any, i: number) => [
    addressesLc[i],
    parseValue(value, options.decimals)
  ]));

  return Object.fromEntries(
    getVotesResponse.map((value: any, i: number) => [
      addresses[i],
      getVotesWithOverride(addressesLc[i], parseValue(value, options.decimals), delegators, delegates, balances)
    ])
  );
}

function getVotesWithOverride(address: string, votes: number, delegators: Record<string, string>, delegates: Record<string, Array<string>>, balances: Record<string, number>): number {
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
  return isAddress(address) && address != "0x0000000000000000000000000000000000000000";
}
