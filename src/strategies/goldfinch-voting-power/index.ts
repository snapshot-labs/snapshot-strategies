import { multicall } from '../../utils';
import _strategies from '..';
import { formatUnits } from '@ethersproject/units';

export const author = 'blakewest';
export const version = '0.1.0';

const COMMUNITY_REWARDS = '0x0Cd73c18C085dEB287257ED2307eC713e9Af3460';
const GFI = '0xdab396cCF3d84Cf2D07C4454e10C8A6F5b008D2b';

const COMMUNITY_REWARDS_ABI = {
  inputs: [
    {
      internalType: 'address',
      name: 'owner',
      type: 'address'
    }
  ],
  name: 'totalUnclaimed',
  outputs: [
    {
      internalType: 'uint256',
      name: '',
      type: 'uint256'
    }
  ],
  stateMutability: 'view',
  type: 'function'
};

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
  const unclaimedCommunityRewards = await multicall(
    network,
    provider,
    [COMMUNITY_REWARDS_ABI],
    addresses.map((address: any) => [
      COMMUNITY_REWARDS,
      'totalUnclaimed',
      [address]
    ]),
    { blockTag }
  );

  // Unclaimed Fidu staking GFI is ignored until smart contract
  // can be upgraded with a view function to minimize calls here

  addresses.forEach((address, index) => {
    const parsedCommunityRewards = parseFloat(
      formatUnits(unclaimedCommunityRewards[index][0], options.decimals)
    );
    gfiResult[address] = gfiResult[address] + parsedCommunityRewards;
  });

  return gfiResult;
}
