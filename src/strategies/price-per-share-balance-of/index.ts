import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'bonustrack';
export const version = '0.1.1';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function pricePerShare() external view returns (uint256)',
  'function decimals() external view returns (uint8)',
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

  multi.call(`${options.address}-price-per-share`, options.address, 'pricePerShare')

  addresses.forEach((address) =>
    multi.call(address, options.address, 'balanceOf', [address])
  );
  const result: Record<string, BigNumber> = await multi.execute();

  const pricePerShare = result[`${options.address}-price-per-share`];

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance.mul(pricePerShare), options.decimals))
    ])
  );
}
