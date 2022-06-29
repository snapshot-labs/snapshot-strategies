import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'rafaqat11';
export const version = '0.1.0';

const abi_erc20 = [
  'function balanceOf(address account) external view returns (uint256)'
];

const abi_pilot_staking = [
  'function userInfo(address) view returns (uint256 lastUpdateRewardToken, uint256 amount, uint256 rewardDebt)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const _addresses = addresses.map((address: string) => address.toLowerCase());

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi_balance = new Multicaller(network, provider, abi_erc20, {
    blockTag
  });
  const multi_staking = new Multicaller(network, provider, abi_pilot_staking, {
    blockTag
  });

  _addresses.forEach((address) => {
    multi_balance.call(address, options.tokenAddress, 'balanceOf', [address]);
    multi_staking.call(address, options.stakingAddress, 'userInfo', [address]);
  });

  const [result_balance, result_staking]: [Record<string, BigNumberish>, any] =
    await Promise.all([multi_balance.execute(), multi_staking.execute()]);

  return Object.fromEntries(
    _addresses.map((address) => {
      const userBalanceInDecimals = parseFloat(
        formatUnits(result_balance[address].toString(), options.decimals)
      );

      const userStakedBalanceInDecimals = parseFloat(
        formatUnits(result_staking[address].amount.toString(), options.decimals)
      );

      return [address, userBalanceInDecimals + userStakedBalanceInDecimals];
    })
  );
}
