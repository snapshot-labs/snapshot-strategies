import {BigNumberish} from '@ethersproject/bignumber';
import {formatUnits} from '@ethersproject/units';
import {Multicaller} from '../../utils';

export const author = '0x-logic';
export const version = '0.0.1';

type UserInfoResponse = {
  amount: BigNumberish;
  plsRewardDebt: BigNumberish;
  esPlsRewardDebt: BigNumberish;
};

const abi = [
  'function userInfo(address account) view returns (uint128 amount, uint128 plsRewardDebt, uint128 esPlsRewardDebt)'
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
    multi.call(address, options.address, 'userInfo', [address])
  );
  const result: Record<string, UserInfoResponse> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, userInfo]) => [
      address,
      parseFloat(formatUnits(userInfo.amount, options.decimals))
    ])
  );
}
