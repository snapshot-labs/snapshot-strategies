import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'bonustrack';
export const version = '0.1.1';

const locker_id_abi = [
  'function ownerToId(address account) external view returns (uint256)'
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

  const multi = new Multicaller(network, provider, locker_id_abi, { blockTag });
  addresses.forEach((address) =>
    multi.call(address, options.address, 'balanceOf', [address])
  );
  const locker_id_result: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    Object.entries(locker_id_result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
