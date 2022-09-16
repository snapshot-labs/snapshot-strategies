import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'ethalend';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function wallets(address account) external view returns (address)'
];

function swapKeys(obj: { [key: string]: string }) {
  const newObj = {};

  for (const key in obj) {
    newObj[obj[key]] = key;
  }

  return newObj;
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
    multi.call(address, options.registry, 'wallets', [address])
  );

  const resultSmartWallets: Record<string, string> = await multi.execute();

  addresses.forEach((address) =>
    multi.call(resultSmartWallets[address], options.address, 'balanceOf', [
      resultSmartWallets[address]
    ])
  );

  const invertedSmartWallets = swapKeys(resultSmartWallets);

  const resultAccounts: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    Object.entries(resultAccounts).map(([address, balance]) => [
      invertedSmartWallets[address],
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
