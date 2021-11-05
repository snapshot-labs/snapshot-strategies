import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'OccamFi';
export const version = '0.1.0';

const abi = [
  'function getStake(address user) public view returns (uint stake)'
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
    multi.call(address, options.stakingContractAddress[0], 'getStake', [
      address
    ])
  );

  const result: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, stake]) => [
      address,
      parseFloat(formatUnits(stake, options.decimals))
    ])
  );
}
