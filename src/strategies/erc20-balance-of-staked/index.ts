import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

const abi = [
  'function balanceOf(address account) external view returns (uint256)'
];

const stakingAbi = [
  'function userStakes(address account) external view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256)'
];

const autoStakingAbi = [
  'function userStake(address account) external view returns (uint112, uint256, uint256)'
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
    multi.call(address, options.address, 'balanceOf', [address])
  );

  const multiStaking = new Multicaller(network, provider, stakingAbi, {
    blockTag
  });
  addresses.forEach((address) =>
    multiStaking.call(address, options.stakingAddress, 'userStakes', [address])
  );

  const multiAutoStaking = new Multicaller(network, provider, autoStakingAbi, {
    blockTag
  });
  addresses.forEach((address) =>
    multiAutoStaking.call(address, options.autoStakingAddress, 'userStake', [
      address
    ])
  );

  //TODO: resolve issues with format + return correct value and format
  const result: Record<string, BigNumberish> = await multi.execute();
  const resultStaking: Record<string, any> = await multiStaking.execute();
  const resultAutoStaking: Record<
    string,
    any
  > = await multiAutoStaking.execute();

  console.log(result);
  console.log(resultStaking);
  console.log(resultAutoStaking);

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
