import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Contract } from '@ethersproject/contracts';
import { Multicaller } from '../../utils';

export const author = 'espendk';
export const version = '1.0.1';

// To avoid future memory issues, we limit the number of members supported by the strategy
export const MAX_MEMBERS = 500;

export const erc721_abi = [
  'function totalMinted() external view returns (uint256)',
  'function ownerOf(uint256 tokenId) external view returns (address)'
];

export const erc6551_registry_abi = [
  'function account(address implementation, bytes32 salt, uint256 chainId, address tokenContract, uint256 tokenId) external view returns (address)'
];

export const erc1155_abi = [
  'function balanceOf(address account, uint256 id) external view returns (uint256)'
];

export const erc20_abi = [
  'function balanceOf(address account) external view returns (uint256)'
];

export type TokenBoundAccount = {
  tokenID: number;
  address: string;
  badgeBalance?: number;
  score?: number;
};

export type Member = {
  address: string;
  TBAs: TokenBoundAccount[];
};

/** Enumerates all accounts with a membership NFT and returns a map of their
 * addresses to their membership NFT ID and the corresponding token-bound account (TBA).
 *
 * Assumptions:
 * - Membership NFTs are never burned.
 */
export async function getAllMembers(
  network,
  provider,
  snapshot,
  membershipERC721: string,
  erc6551Registry: string,
  erc6551Implementation: string,
  erc6551Salt: string
): Promise<Map<string, Member>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // Get the number of membership NFTs that have been minted
  const membershipERC721Contract = new Contract(
    membershipERC721,
    erc721_abi,
    provider
  );
  const totalMinted = await membershipERC721Contract.totalMinted({ blockTag });
  if (totalMinted > MAX_MEMBERS) {
    throw new Error(
      `Max number (${MAX_MEMBERS}) of members exceeded: ${totalMinted}`
    );
  }

  // Get the member addresses and TBAs for all the membership NFTs that have been minted
  const membershipERC721Multicaller = new Multicaller(
    network,
    provider,
    erc721_abi,
    { blockTag }
  );
  const erc6551RegistryMulticaller = new Multicaller(
    network,
    provider,
    erc6551_registry_abi,
    { blockTag }
  );

  for (let id = 1; id <= totalMinted; ++id) {
    membershipERC721Multicaller.call(id, membershipERC721, 'ownerOf', [id]);
    erc6551RegistryMulticaller.call(id, erc6551Registry, 'account', [
      erc6551Implementation,
      erc6551Salt,
      network,
      membershipERC721,
      id
    ]);
  }

  const ownerByTokenIdPromise: Promise<Record<string, string>> =
    membershipERC721Multicaller.execute();
  const tokenBoundAccountsByTokenId: Record<string, string> =
    await erc6551RegistryMulticaller.execute();
  const ownerByTokenId: Record<string, string> = await ownerByTokenIdPromise;

  const members = new Map<string, Member>();
  for (let id = 1; id <= totalMinted; ++id) {
    const memberAddress = ownerByTokenId[id];
    const tba = tokenBoundAccountsByTokenId[id];
    let member = members.get(memberAddress);
    if (member === undefined) {
      member = { address: memberAddress, TBAs: [] };
      members.set(memberAddress, member);
    }
    member.TBAs.push({ tokenID: id, address: tba });
  }

  return members;
}

/** Fetches the badge balance for all the given members' TBA's. */
export async function fetchBadgeBalances(
  network,
  provider,
  snapshot,
  members: Map<string, Member>,
  badgesERC1155: string,
  badgeId: number
) {
  if (members.size === 0) {
    return;
  }
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // Get the Badge balances for all the token bound accounts
  const erc1155Multicaller = new Multicaller(network, provider, erc1155_abi, {
    blockTag
  });
  for (const [, member] of members) {
    for (const tba of member.TBAs) {
      erc1155Multicaller.call(tba.address, badgesERC1155, 'balanceOf', [
        tba.address,
        badgeId
      ]);
    }
  }

  const badgeBalanceByTBA: Record<string, string> =
    await erc1155Multicaller.execute();

  for (const [, member] of members) {
    for (const tba of member.TBAs) {
      tba.badgeBalance = parseInt(badgeBalanceByTBA[tba.address]);
    }
  }
}

/** Fetches the score for all the given members' TBA's. */
export async function fetchScores(
  network,
  provider,
  snapshot,
  members: Map<string, Member>,
  scoreERC20: string,
  scoreDecimals: number
) {
  if (members.size === 0) {
    return;
  }
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // Get the Scores for all the members with the badge
  const erc20Multicaller = new Multicaller(network, provider, erc20_abi, {
    blockTag
  });
  for (const [, member] of members) {
    for (const tba of member.TBAs) {
      erc20Multicaller.call(tba.address, scoreERC20, 'balanceOf', [
        tba.address
      ]);
    }
  }

  const scoreByMember: Record<string, BigNumberish> =
    await erc20Multicaller.execute();

  for (const [, member] of members) {
    for (const tba of member.TBAs) {
      tba.score = parseFloat(
        formatUnits(scoreByMember[tba.address], scoreDecimals)
      );
    }
  }
}

/** Filters the members by a predicate. */
export function filterMembers(
  members: Map<string, Member>,
  predicate: (member: Member) => boolean
): Map<string, Member> {
  const result = new Map<string, Member>();

  for (const [, member] of members) {
    if (predicate(member)) {
      result.set(member.address, member);
    }
  }

  return result;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  let members = await getAllMembers(
    network,
    provider,
    snapshot,
    options.membershipERC721,
    options.erc6551Registry,
    options.erc6551Implementation,
    options.erc6551Salt
  );

  // Keep only members in the list of queried addresses
  members = filterMembers(members, (member) =>
    addresses.includes(member.address)
  );

  await fetchBadgeBalances(
    network,
    provider,
    snapshot,
    members,
    options.badgesERC1155,
    options.badgeId
  );

  // Keep only members with a badge
  members = filterMembers(members, (member) =>
    member.TBAs.some((tba) => (tba.badgeBalance ?? 0) > 0)
  );

  await fetchScores(
    network,
    provider,
    snapshot,
    members,
    options.scoreERC20,
    options.scoreDecimals
  );

  // Build address -> score mapping
  // Include only scores for TBA's with a badge
  const result = {};
  for (const [, member] of members) {
    result[member.address] = 0;
    for (const tba of member.TBAs) {
      if ((tba.badgeBalance ?? 0) > 0) {
        result[member.address] += tba.score;
      }
    }
  }
  return result;
}
