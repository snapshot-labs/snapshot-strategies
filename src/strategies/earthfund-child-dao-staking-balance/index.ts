import { BigNumberish } from '@ethersproject/bignumber';
import { formatEther } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'bonustrack';
export const version = '0.1.1';

const abi = [
  'function userStakes(address _daoToken, address _user) external view returns(uint256 stakedAmount, uint256 rewardEntry, uint256 pendingRewards, uint256 timeStaked)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    multi.call(address, options.stakingRewardsContractAddress, 'userStakes', [
      options.childDaoTokenAddress,
      address
    ])
  );

  const result: Record<string, BigNumberish[]> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, userStake]) => [
      address,
      parseFloat(formatEther(userStake[0])) // staked balance is the first item in the returned tuple from the contract call
    ])
  );
}
