import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'bonustrack';
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
  const exclude = new Set<string>(
    options.blacklist?.map((x) => x.toLowerCase()) ?? []
  );
  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses
    .filter((a) => !exclude.has(a.toLowerCase()))
    .forEach((address) =>
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
