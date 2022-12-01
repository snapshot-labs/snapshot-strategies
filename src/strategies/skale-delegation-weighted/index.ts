import { BigNumberish, BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller, multicall } from '../../utils';

export const author = 'payvint';
export const version = '1.0.0';

const abi = [
  'function getAndUpdateDelegatedAmount(address wallet) external returns (uint)',
  'function getEscrowAddress(address beneficiary) external view returns (address)'
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
  addresses.forEach((address) => {
    multi.call(address, options.addressSKL, 'getAndUpdateDelegatedAmount', [
      address
    ]);
  });
  const resultAccounts: Record<string, BigNumberish> = await multi.execute();

  console.log(resultAccounts);

  const escrowAddressCallsQuery = addresses.map((address: any) => [
    options.addressAllocator,
    'getEscrowAddress',
    [address]
  ]);

  const escrowAddressesFromAccount = await multicall(
    network,
    provider,
    abi,
    [...escrowAddressCallsQuery],
    {
      blockTag
    }
  );

  const addressToEscrow = new Map();
  addresses.forEach((address: any, index: number) => {
    addressToEscrow[address] = escrowAddressesFromAccount[index][0];
  });

  addresses.forEach((address: any) => {
    multi.call(address, options.addressSKL, 'getAndUpdateDelegatedAmount', [
      addressToEscrow[address]
    ]);
  });

  const resultEscrows: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    Object.entries(resultAccounts).map(([address, balance]) => [
      address,
      parseFloat(
        formatUnits(
          BigNumber.from(balance).add(BigNumber.from(resultEscrows[address]))
        )
      )
    ])
  );
}
