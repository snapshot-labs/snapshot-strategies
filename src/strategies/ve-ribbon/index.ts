import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'bonustrack';
export const version = '0.1.1';

interface LockedBalance {
  amount: number;
  end: number;
}

const VOTING_ESCROW = "0x19854C9A5fFa8116f48f984bDF946fB9CEa9B5f7"

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function locked(address account) external view returns (LockedBalance)'
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
    multi.call(address, options.address, 'balanceOf', [address])
  );
  const resultUnlocked: Record<string, BigNumberish> = await multi.execute();

  addresses.forEach((address) =>
    multi.call(address, VOTING_ESCROW, 'locked', [address])
  );
  const resultLocked: Record<string, LockedBalance> = await multi.execute();


  return Object.fromEntries(
    Object.entries(resultUnlocked).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance.add(resultLocked[address].amount), options.decimals))
    ])
  );
}
