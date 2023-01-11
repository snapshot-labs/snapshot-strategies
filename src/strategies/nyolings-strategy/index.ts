import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'jsmth';
export const version = '0.0.1';
const ABI = [
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
  const multi = new Multicaller(network, provider, ABI, { blockTag });

  // Get the balance of nyolings for each address
  addresses.forEach((address) =>
    multi.call(address, options.stakingAddr, 'balanceOf', [address])
  );

  // Get the total staked for each address
  addresses.forEach((address) =>
    multi.call(address, options.address, 'balanceOf', [address])
  );

  const result: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
