import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'wolfwarrier14';
export const version = '0.1.0';

const abi = [
  'function ownerToId(address) view returns (uint256)',
  'function balanceOfLockerId(uint256 _lockerId) view returns (uint256)'
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
    multi.call(address, options.address, 'ownerToId', [address])
  );
  const locker_id_result: Record<string, BigNumberish> = await multi.execute();

  Object.entries(locker_id_result).map(([address, locker_id]) =>
    multi.call(address, options.address, 'balanceOfLockerId', [locker_id])
  );
  const balance_result: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    Object.entries(balance_result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
