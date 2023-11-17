import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'AlissonRS';
export const version = '0.0.1';

const tokenAbi = [
  'function balanceOf(address account) external view returns (uint256)'
];

const poolAbi = [
  'function getUserStakes(address _user) external view returns (tuple(uint256 stakedAmount, uint256 minimumStakeTimestamp, uint256 duration, uint256 rewardPerTokenPaid, uint256 rewards)[])'
];

const multiplierAbi = [
  'function applyMultiplier(uint256 _amount, uint256 _duration) external view returns (uint256)'
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

  const balanceMulti = new Multicaller(network, provider, tokenAbi, {
    blockTag
  });
  addresses.forEach((address) =>
    balanceMulti.call(address, options.tokenAddress, 'balanceOf', [address])
  );
  const balanceResult: Record<string, BigNumberish> =
    await balanceMulti.execute();

  // Find the staked tokens
  const stakingMulti = new Multicaller(network, provider, poolAbi, {
    blockTag
  });
  addresses.forEach((address) =>
    stakingMulti.call(address, options.stakingPoolAddress, 'getUserStakes', [
      address
    ])
  );
  const stakingResult: Record<string, any> = await stakingMulti.execute();

  // Get the multiplier factor for each wallet
  const multiplierMulti = new Multicaller(network, provider, multiplierAbi, {
    blockTag
  });
  Object.entries(stakingResult).forEach(([address, stakesInfo]) => {
    stakesInfo.forEach((stakeInfo, i) =>
      multiplierMulti.call(
        `${address}-${i}`,
        options.stakingPoolMultiplierAddress,
        'applyMultiplier',
        [stakeInfo.stakedAmount, stakeInfo.duration]
      )
    );
  });
  const multiResult: Record<string, any> = await multiplierMulti.execute();

  // Add staking tokens to the balance
  Object.entries(multiResult).forEach(([addressPos, stakeBalance]) => {
    const address = addressPos.substring(0, 42);
    balanceResult[address] = BigNumber.from(balanceResult[address]).add(
      stakeBalance
    );
  });

  return Object.fromEntries(
    Object.entries(balanceResult).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
