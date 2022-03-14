import { multicall } from '../../utils';
import _strategies from '..';

export const author = 'blakewest';
export const version = '0.1.0';

const LP_STAKING_REWARDS = '0xFD6FF39DA508d281C2d255e9bBBfAb34B6be60c3';
const COMMUNITY_REWARDS = '0x0Cd73c18C085dEB287257ED2307eC713e9Af3460';
const GFI = '0xdab396cCF3d84Cf2D07C4454e10C8A6F5b008D2b';
const LP_STAKING_REWARDS_ABI = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256'
      }
    ],
    name: 'earnedSinceLastCheckpoint',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256'
      }
    ],
    name: 'claimableRewards',
    outputs: [
      {
        internalType: 'uint256',
        name: 'rewards',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
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
  const strategyFn = _strategies['erc20-balance-of'].strategy;
  const gfiResult: { [address: string]: number } = await strategyFn(
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
  // 1.) Get tokenIds
  // 2.) Check totalGranted - totalClaimed
  const goListResult = await multicall(
    network,
    provider,
    [goListAbi],
    addresses.map((address: any) => [
      LP_STAKING_REWARDS,
      'goList',
      [address]
    ]),
    { blockTag }
  );


  // Unclaimed Fidu staking GFI
  // 1.) Get tokenIds
  // 2.) call claimable + earnedSinceLastCheckPoint

  // If you don't have a UID, but are on the goList, that's OK.
  addresses.forEach((address, index) => {
    if (!uidResult[address] && goListResult[index][0]) {
      uidResult[address] = 1;
    }
  });

  return uidResult;
}
