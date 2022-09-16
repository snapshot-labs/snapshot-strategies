import { multicall } from '../../utils';
import { strategy as erc20BalanceOf } from '../erc20-balance-of';
import { formatUnits } from '@ethersproject/units';

export const author = 'sanjayprabhu';
export const version = '0.1.0';

const COMMUNITY_REWARDS = '0x0Cd73c18C085dEB287257ED2307eC713e9Af3460';
const STAKING_REWARDS = '0xFD6FF39DA508d281C2d255e9bBBfAb34B6be60c3';
const GFI = '0xdab396cCF3d84Cf2D07C4454e10C8A6F5b008D2b';

const COMMUNITY_REWARDS_ABI = [
  'function totalUnclaimed(address owner) view returns (uint256)'
];
const STAKING_REWARDS_ABI = [
  'function totalOptimisticClaimable(address owner) view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // Held GFI
  const gfiResult: { [address: string]: number } = await erc20BalanceOf(
    space,
    network,
    provider,
    addresses,
    {
      address: GFI,
      symbol: 'GFI'
    },
    snapshot
  );

  // Locked amount in Community Rewards
  const unclaimedCommunityRewards = await multicall(
    network,
    provider,
    COMMUNITY_REWARDS_ABI,
    addresses.map((address: any) => [
      COMMUNITY_REWARDS,
      'totalUnclaimed',
      [address]
    ]),
    { blockTag }
  );

  const unclaimedStakingRewards = await multicall(
    network,
    provider,
    STAKING_REWARDS_ABI,
    addresses.map((address: any) => [
      STAKING_REWARDS,
      'totalOptimisticClaimable',
      [address]
    ]),
    { blockTag }
  );

  addresses.forEach((address, index) => {
    const parsedCommunityRewards = parseFloat(
      formatUnits(unclaimedCommunityRewards[index][0], options.decimals)
    );
    const parsedStakingRewards = parseFloat(
      formatUnits(unclaimedStakingRewards[index][0], options.decimals)
    );
    gfiResult[address] =
      gfiResult[address] + parsedCommunityRewards + parsedStakingRewards;
  });

  return gfiResult;
}
