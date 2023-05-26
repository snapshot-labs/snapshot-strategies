import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import fetch from 'cross-fetch';

export const author = 'zhakt';
export const version = '0.0.2';

const abi = [
  'function balanceOf(address account) external view returns (uint256)'
];

const LIMIT_ADDRESSES = 500;
const LIMIT_QUERY_REQUESTS = 4;

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
    throw new Error('Error while executing request');
  }

  const addressList = await res.json();

  let requestsCount: number =
    Math.ceil(addressList.length / LIMIT_ADDRESSES) || 0;
  if (requestsCount === 0) throw new Error('Empty array of addresses');
  requestsCount =
    requestsCount > LIMIT_QUERY_REQUESTS ? LIMIT_QUERY_REQUESTS : requestsCount;

  const addressListObjects: { address: string; balance: number }[] =
    addressList.map(([address, balance]) => ({ [address]: balance }));

  let addressListBalance: Record<string, BigNumberish> = {};
  for (let i = 0; i < requestsCount; i++) {
    addressList
      .slice(i * LIMIT_ADDRESSES, (i + 1) * LIMIT_ADDRESSES)
      .forEach((address) =>
        multi.call(address[0], options.address, 'balanceOf', [address[0]])
      );

    const addressListBalancePart: Record<string, BigNumberish> =
      await multi.execute();
    addressListBalance = { ...addressListBalance, ...addressListBalancePart };
  }

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
