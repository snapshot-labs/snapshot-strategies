import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import fetch from 'cross-fetch';

export const author = 'zhakt';
export const version = '0.0.2';

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
  const multi = new Multicaller(network, provider, abi, { blockTag });

  const blockNumber = typeof snapshot === 'number' ? snapshot : 1;
  const url = new URL(options.url);
  url.searchParams.set('block', String(blockNumber));

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });

  if (res.status !== 200) {
    throw new Error('Error while executing request');
  }

  const addressList = await res.json();

  const addressListObjects: { address: string; balance: number }[] =
    addressList.map(([address, balance]) => ({ [address]: balance }));

  addresses.forEach((address) =>
    multi.call(address, options.address, 'balanceOf', [address])
  );

  const addressListBalance: Record<string, BigNumberish> =
    await multi.execute();

  const addressObject = addressListObjects.reduce(
    (accumulator: any, currentValue: any) => ({
      ...accumulator,
      ...currentValue
    }),
    {}
  );

  const result = Object.fromEntries(
    Object.entries(addressListBalance).map(([address, balance]) => [
      address,
      parseFloat(addressObject[address] || 0) +
        parseFloat(formatUnits(balance, options.decimals))
    ])
  );

  return result;
}
