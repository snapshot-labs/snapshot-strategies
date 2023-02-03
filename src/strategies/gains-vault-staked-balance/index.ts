import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'onecri';
export const version = '0.0.1';

const abi = [
  'function userDeposit(address user) external view returns (uint256, uint256)'
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
  addresses.forEach((address) =>
    multi.call(address, options.vault, 'userDeposit', [address])
  );
  const result: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, res]) => [
      address,
      parseFloat(formatUnits(res[0], options.decimals))
    ])
  );
}
