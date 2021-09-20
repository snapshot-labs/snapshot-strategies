/* eslint-disable prettier/prettier */
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'PolySwift';
export const version = '0.1.0';


const singleStakingPoolAbi = [
  'function userInfo(address) view returns (uint256 amount, uint256 rewardDebt)'
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

  const multi = new Multicaller(network, provider, singleStakingPoolAbi, { blockTag });

  options.stakingPoolAddresses.forEach(stakingPoolAddress => {
    addresses.forEach((address) =>
      multi.call(address, stakingPoolAddress, 'userInfo', [address])
    );
  })

  const result: Record<string, any> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, userInfo]) => [
      address,
      parseFloat(formatUnits(userInfo.amount, options.decimals))
    ])
  );
}
