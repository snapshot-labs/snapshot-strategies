import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'prepo-io';
export const version = '1.0.0';

const abi = [
  'function getAmountAllocated(address _recipient) external view returns (uint256)',
  'function getClaimableAmount(address _recipient) external view returns (uint256)',
  'function getVestedAmount(address _recipient) external view returns (uint256)',
  'function isPaused() external view returns (bool)'
];

type MulticallOutput = Record<string, Record<string, BigNumberish>>;

const convertBN = (amount: BigNumberish, unitName?: BigNumberish) =>
  parseFloat(formatUnits(amount, unitName));

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const { address, multiplier } = options;

  const multi = new Multicaller(network, provider, abi, { blockTag });

  addresses.forEach((addr) => {
    multi.call(`allocated.${addr}`, address, 'getAmountAllocated', [addr]);
    multi.call(`claimable.${addr}`, address, 'getClaimableAmount', [addr]);
    multi.call(`vested.${addr}`, address, 'getVestedAmount', [addr]);
    multi.call(`isPaused`, address, 'isPaused', []);
  });

  const { allocated, claimable, vested, isPaused }: MulticallOutput =
    await multi.execute();

  const output = Object.fromEntries(
    Object.entries(allocated).map(([address, amountAllocated]) => {
      const unclaimedVestedBalance = convertBN(claimable[address], 18);
      const unvestedBalance = convertBN(
        BigNumber.from(amountAllocated).sub(vested[address]),
        18
      );
      const score = isPaused
        ? (unclaimedVestedBalance + unvestedBalance) * multiplier
        : unclaimedVestedBalance + unvestedBalance * multiplier;
      return [address, score];
    })
  );
  return output;
}
