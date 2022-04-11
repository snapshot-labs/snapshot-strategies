import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'btcmt-minto';
export const version = '0.1.0';

const abi = [
  'function balanceOfSum(address account) external view returns (uint256)'
];

const stakingAbi = [
  'function userStakes(address account) external view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256)'
];

const autoStakingAbi = [
  'function userStake(address account) external view returns (uint256, uint256, uint256)'
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

  const multiStaking = new Multicaller(network, provider, stakingAbi, {
    blockTag
  });
  const multiAutoStaking = new Multicaller(network, provider, autoStakingAbi, {
    blockTag
  });

  addresses.forEach((address) => {
    multi.call(address, options.address, 'balanceOfSum', [address]);
    multiStaking.call(address, options.stakingAddress, 'userStakes', [address]);
    multiAutoStaking.call(address, options.autoStakingAddress, 'userStake', [
      address
    ]);
  });

  const [result, resultStaking, resultAutoStaking] = await Promise.all([
    multi.execute(),
    multiStaking.execute(),
    multiAutoStaking.execute()
  ]);

  return Object.fromEntries(
    addresses.map((address) => {
      const sum =
        parseFloat(formatUnits(result[address], options.decimals)) +
        parseFloat(formatUnits(resultStaking[address][1], options.decimals)) +
        parseFloat(
          formatUnits(resultAutoStaking[address][0], options.decimals)
        );
      return [address, sum];
    })
  );
}
