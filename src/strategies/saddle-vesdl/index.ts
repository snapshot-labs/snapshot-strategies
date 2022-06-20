import { BigNumberish, BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'saddle-finance';
export const version = '0.1.0';

const VOTING_ESCROW = '0xD2751CdBED54B87777E805be36670D7aeAe73bb2';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function locked(address account) external view returns (int128, uint256)'
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
  const resultLocked: Record<
    string,
    [BigNumberish, BigNumberish]
  > = await multi.execute();

  return Object.fromEntries(
    Object.entries(resultUnlocked).map(([address, balance]) => [
      address,
      parseFloat(
        formatUnits(
          BigNumber.from(balance).add(BigNumber.from(resultLocked[address][0])),
          options.decimals
        )
      )
    ])
  );
}
