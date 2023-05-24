import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import fetch from 'cross-fetch';

export const author = 'tzhak';
export const version = '0.0.1';

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

  const url = `${options.url}?block=${snapshot}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });
  const addressList = await res.json();

  const addressListObjects: { address: string; balance: number }[] =
    addressList.map(([address, balance]) => ({ [address]: balance }));

  addressList.forEach((address) =>
    multi.call(address[0], options.address, 'balanceOf', [address[0]])
  );

  const addressListBalance: Record<string, BigNumberish> =
    await multi.execute();

  const addressObject = addressListObjects.reduce(
    (a: any, v: any) => ({
      ...a,
      ...v
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
