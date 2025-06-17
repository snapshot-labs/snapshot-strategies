import { BigNumber } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';
import { formatUnits } from '@ethersproject/units';

export const author = 'forte';
export const version = '0.1.0';

type batch = [stakeAmount: BigNumber, timeStamp: BigNumber];
const stakeAmount = 0; // index of the stake amount in the batch tuple
const timeStamp = 1; // index of the timestamp in the batch tuple
const abiStaking = [
  'function getStakedBatches(address _user) external view returns ((uint256, uint256)[] memory)'
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

  // getting the staked batches
  const stakeCall = new Multicaller(network, provider, abiStaking, {
    blockTag
  });
  addresses.forEach((address) =>
    stakeCall.call(address, options.stakingAddress, 'getStakedBatches', [
      address
    ])
  );
  const stakeResult: Record<string, batch[]> = await stakeCall.execute();

  // getting external multiplier

  const externalMultiplierCall = new Multicaller(
    network,
    provider,
    [options.externalMultiplierABI],
    {
      blockTag
    }
  );
  addresses.forEach((address) =>
    externalMultiplierCall.call(
      address,
      options.externalMultiplierAddress,
      options.externalMultiplierFunction,
      [address]
    )
  );
  const externalMultiplierResult: Record<string, number> =
    options.externalMultiplierAddress
      ? await externalMultiplierCall.execute()
      : [];

  // return voting power
  return Object.fromEntries(
    Object.entries(stakeResult).map(([address, rawBatches]) => [
      address,
      calculateVotingPower(
        rawBatches,
        options.multiplierNumerator,
        options.multiplierDenominator,
        options.daysOffset,
        externalMultiplierResult[address],
        options.externalMultiplierCeiling
      )
    ])
  );
}

function calculateVotingPower(
  rawBatches: batch[],
  numerator: number,
  denominator: number,
  offset: number,
  externalMultiplier: number = 1,
  externalMultiplierCeiling: number = 1
): number {
  let preKYCPower: bigint = rawBatches.reduce(
    (votingPower: bigint, batch: batch): bigint => {
      const today: number = +new Date();
      const stakeDate: number = +new Date(Number(batch[timeStamp]._hex) * 1000); // * 1000 to convert to ms
      const daysStaked: number = Math.floor(
        (today - stakeDate) / (60 * 60 * 24 * 1000) // (...) / (1 day in ms)
      );
      const stake: bigint = BigInt(batch[stakeAmount]._hex);
      return (
        votingPower +
        (stake *
          BigInt(
            numerator * (daysStaked > -offset ? daysStaked + offset : 0)
          )) /
          BigInt(denominator)
      );
    },
    0n
  );
  return parseFloat(
    formatUnits(
      preKYCPower *
        BigInt(
          externalMultiplier > externalMultiplierCeiling
            ? externalMultiplierCeiling
            : externalMultiplier
        )
    )
  );
}
