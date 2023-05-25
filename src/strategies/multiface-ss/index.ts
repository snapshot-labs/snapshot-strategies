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

  const url = new URL(options.url);
  url.searchParams.set('block', snapshot);

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });

  if (res.status !== 200) {
    throw new Error('Ошибка при выполнении запроса');
  }

  const addressList = await res.json();

  const addressListObjects: { address: string; balance: number }[] =
    addressList.map(([address, balance]) => ({ [address]: balance }));

  addressList.forEach((address) =>
    multi.call(address[0], options.address, 'balanceOf', [address[0]])
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

  return Object.fromEntries(
    Object.entries(addressListBalance).map(([address, balance]) => [
      address,
      parseFloat(addressObject[address] || 0) +
        parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
