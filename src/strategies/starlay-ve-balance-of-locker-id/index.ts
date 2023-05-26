import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'wolfwarrier14';
export const version = '0.1.1';

const abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'ownerToId',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_lockerId',
        type: 'uint256'
      }
    ],
    name: 'balanceOfLockerId',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
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
