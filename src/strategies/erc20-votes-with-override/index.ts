import { formatUnits } from '@ethersproject/units';
import { isAddress } from '@ethersproject/address';
import { multicall } from '../../utils';

export const author = 'serenae-fansubs';
export const version = '0.1.0';

const getVotesName = "getVotes";
const getVotesABI = ["function getVotes(address account) view returns (uint256)"];
const balanceOfName = "balanceOf";
const balanceOfABI = ["function balanceOf(address account) external view returns (uint256)"];
const delegatesName = "delegates";
const delegatesABI = ["function delegates(address account) external view returns (address)"];

/*
  Counts votes from delegates, and also from individual delegators who wish
  to override the vote of their delegate.

  Makes three multicalls for votes, delegates, and balances.

  If getVotes returns a nonzero value, then that is used. Then any delegators
  that have individually voted will have their balances subtracted from the
  result.

  If getVotes returns zero, then it will return the token balance, provided
  that the address is delegated to a valid address.

  Otherwise, returns zero.

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
  const addressesLc = addresses.map((address) => address.toLowerCase());
  
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
    .filter((value: any) => isValidAddress(getFirst(value)))
    .map((value: any, i: number) => [
      addressesLc[i],
      getFirst(value).toLowerCase()
  ]));

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
      [address.toLowerCase()]
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

function getVotesWithOverride(address: string, votes: number, delegators: Object, delegates: Object, balances: Object): number {
  if (votes > 0) {
    // Subtract any overridden votes
    const adjustedVotes = { votes };
    delegates[address].forEach(
      (delegate: string) => (adjustedVotes.votes -= balances[delegate])
    );
    return adjustedVotes.votes;
  } else if (isValidAddress(delegators[address])) {
    // Delegating to someone else, just return the balance
    return balances[address];
  } else {
    // Not delegating at all
    return 0;
  }
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

function isValidAddress(address: string): boolean {
  return isAddress(address) && address != "0x0000000000000000000000000000000000000000";
}
