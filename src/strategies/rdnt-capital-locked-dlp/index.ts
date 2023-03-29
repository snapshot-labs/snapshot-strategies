import { Multicaller } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';
import { getAddress } from '@ethersproject/address';

export const author = 'JDoy99';
export const version = '0.1.0';

const abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'user',
        type: 'address'
      }
    ],
    name: 'lockedBalances',
    outputs: [
      {
        internalType: 'uint256',
        name: 'total',
        type: 'uint256'
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256'
          }
        ],
        internalType: 'struct LockedBalance[]',
        name: 'lockData',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

const contractAddress = '0x76ba3eC5f5adBf1C58c91e86502232317EeA72dE';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });

  addresses.forEach((address) => {
    multi.call(`${address}.lockedBalances`, contractAddress, 'lockedBalances', [
      address
    ]);
  });

  const result = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, value]: any) => {
      const lockedBalances = value.lockedBalances as { total: string };
      const totalLocked = BigNumber.from(lockedBalances.total);
      return [getAddress(address), parseFloat(totalLocked.toString())];
    })
  );
}
