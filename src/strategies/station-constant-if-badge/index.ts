import {
  getAllMembers,
  filterMembers,
  fetchBadgeBalances
} from '../station-score-if-badge';

export const author = 'espendk';
export const version = '1.0.1';

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

  // Build address -> const
  const result = {};
  for (const [, member] of members) {
    result[member.address] = options.constant;
  }
  return result;
}
