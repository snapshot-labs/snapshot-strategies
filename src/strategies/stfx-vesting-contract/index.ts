import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = '0xItadori';
export const version = '0.1.1';

const abi = [
  'function balanceOf(address account) external view returns (uint256)'
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

  // This strategy needs to query whether an address has a corresponding vesting contract
  // There is a method on the VestingFactory contract:
  // https://etherscan.io/address/0x7777bd6a0bFc050c3D4673f370E8746cc6b13Bb5
  // that returns the address of the vesting contract for a given address
  // If the address has no vesting contract, the method errors
  const multi = new Multicaller(
    network,
    provider,
    [
      {
        inputs: [
          {
            internalType: 'address',
            name: '',
            type: 'address'
          }
        ],
        name: 'recipientVesting',
        outputs: [
          {
            internalType: 'address',
            name: '',
            type: 'address'
          }
        ],
        stateMutability: 'view',
        type: 'function'
      }
    ],
    { blockTag }
  );
  const multi2 = new Multicaller(network, provider, abi, { blockTag });

  addresses.forEach((address) =>
    multi.call(address, options.vestingAddress, 'recipientVesting', [address])
  );
  const result: Record<string, string> = await multi.execute();

  const addressList = Object.entries(result).map(([address, value]) => {
    if (value === '0x0000000000000000000000000000000000000000') return address;
    return value;
  });

  addressList.forEach((address) =>
    multi2.call(address, options.tokenAddress, 'balanceOf', [address])
  );

  const balanceResult: Record<string, BigNumberish> = await multi2.execute();

  // Then for each address with a vesting contract, we need to query the balance of the vesting contract
  // for the STFX token (https://etherscan.io/token/0x9343e24716659A3551eB10Aff9472A2dcAD5Db2d)
  // on the vesting contract and assign that to the address as voting score
  return Object.fromEntries(
    Object.entries(balanceResult).map(([address, balance]) => [
      getAddress(address),
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
