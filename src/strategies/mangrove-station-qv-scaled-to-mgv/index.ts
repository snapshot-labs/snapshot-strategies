import {
  getAllMembers,
  fetchBadgeBalances,
  fetchScores
} from '../station-score-if-badge';
import { getAllVestings } from '../dss-vest-unpaid';

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
  const members = await getAllMembers(
    network,
    provider,
    snapshot,
    options.membershipERC721,
    options.erc6551Registry,
    options.erc6551Implementation,
    options.erc6551Salt
  );

  await fetchBadgeBalances(
    network,
    provider,
    snapshot,
    members,
    options.badgesERC1155,
    options.activeBadgeId
  );

  // Keep only TBAs and members with a badge
  for (const [, member] of members) {
    member.TBAs = member.TBAs.filter((tba) => (tba.badgeBalance ?? 0) > 0);
    if (member.TBAs.length === 0) {
      members.delete(member.address);
    }
  }

  await fetchScores(
    network,
    provider,
    snapshot,
    members,
    options.activityScoreERC20,
    options.activityScoreDecimals
  );

  // Aggregate membership scores and apply quadratic voting
  const activeMemberScores = new Map<string, number>();
  let totalScore = 0;
  for (const [, member] of members) {
    let score = 0;
    for (const tba of member.TBAs) {
      score += tba.score ?? 0;
    }
    score = Math.sqrt(score);
    activeMemberScores.set(member.address, score);
    totalScore += score;
  }

  // Get the circulating supply of the vesting token
  const allVestings = await getAllVestings(
    network,
    provider,
    snapshot,
    options.dssVestAddress,
    options.dssVestDecimals
  );
  const circulatingSupply = allVestings.reduce(
    (acc, vesting) => acc + vesting.accrued,
    0
  );

  // Scale scores to the circulating supply of the vesting token
  const scale = circulatingSupply / totalScore;
  for (const [address, score] of activeMemberScores) {
    activeMemberScores.set(address, score * scale);
  }

  // Build address -> scaled score for the queried addresses
  const result = {};
  for (const [address, score] of activeMemberScores) {
    if (addresses.includes(address)) {
      result[address] = score;
    }
  }
  return result;
}
