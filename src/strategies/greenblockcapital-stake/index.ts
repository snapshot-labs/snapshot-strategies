import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'spcdex-io';
export const version = '0.0.1';

const abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'wallet_',
        type: 'address'
      }
    ],
    name: 'getWalletInfo',
    outputs: [
      {
        internalType: 'uint256',
        name: 'stakedBal',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'startTime',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'rewards',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

interface WalletInfo {
  stakedBal: BigNumberish;
  startTime: BigNumberish;
  rewards: BigNumberish;
}

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
    multi.call(address, options.address, 'getWalletInfo', [address])
  );
  const result: Record<string, WalletInfo> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, walletInfo]) => [
      address,
      parseFloat(formatUnits(walletInfo.stakedBal, options.decimals))
    ])
  );
}
