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
  const address1 = '';
  const address2 = '';

  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    multi.call(address1, address2, 'balanceOfSum', [address])
  );
  const resultBalance: Record<string, BigNumberish> = await multi.execute();
  addresses.forEach((address) =>
    multi.call(address, options.address, 'userStakes', [address])
  );
  const resultStake: Record<string, BigNumberish> = await multi.execute();
  const result = resultBalance + resultStake;
  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
