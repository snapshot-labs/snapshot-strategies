/* eslint-disable prettier/prettier */
import { formatUnits } from '@ethersproject/units';
import { multicall, Multicaller } from '../../utils';

export const author = 'macaronchef';
export const version = '0.1.0';
export const dependOnOtherAddress = false;

const abi = [
  'function userInfo(address) view returns (uint256 shares, uint256 lastDepositedTime, uint256 macaronAtLastUserAction, uint256 lastUserActionTime, uint256 lockStartTime, uint256 lockEndTime, uint256 userBoostedShare, bool locked, uint256 lockedAmount)',
  'function getPricePerFullShare() view returns (uint256)'
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
    multi.call(address, options.stakingPoolAddress, 'userInfo', [address])
  );

  const [[[getPricePerFullShare]]] = await Promise.all([
    multicall(
      network,
      provider,
      abi,
      [[options.stakingPoolAddress, 'getPricePerFullShare', []]],
      { blockTag }
    )
  ]);

  const result: Record<string, any> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, userInfo]) => {
      const fee = formatUnits(userInfo.userBoostedShare, options.decimals);
      return [
        address,
        (parseFloat(formatUnits(userInfo.shares, options.decimals)) * parseFloat(formatUnits(getPricePerFullShare, options.decimals))) - parseFloat(fee)
      ];
    })
  );
}
