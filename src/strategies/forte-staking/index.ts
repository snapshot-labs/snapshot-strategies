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

const abiKYC = [
  'function getAccessLevel(address _account) external view returns (uint8)'
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

  // getting the KYC level
  const kycCall = new Multicaller(network, provider, abiKYC, {
    blockTag
  });
  addresses.forEach((address) =>
    kycCall.call(address, options.kycAddress, 'getAccessLevel', [address])
  );
  const kycResult: Record<string, number> = await kycCall.execute();

  // return voting power
  return Object.fromEntries(
    Object.entries(stakeResult).map(([address, rawBatches]) => [
      address,
      calculateVotingPower(rawBatches, kycResult[address])
    ])
  );
}

function calculateVotingPower(rawBatches: batch[], kycLevel: number): number {
  let votingPower: bigint = 0n;
  rawBatches.forEach((batch) => {
    console.log('batch', batch);
    const today: number = +new Date();
    const stakeDate: number = +new Date(Number(batch[timeStamp]._hex) * 1000); // * 1000 to convert to ms
    const daysStaked: number = Math.floor(
      (today - stakeDate) / (60 * 60 * 24 * 1000) // (...) / (1 day in ms)
    );
    const stake: bigint = BigInt(batch[stakeAmount]._hex);
    votingPower +=
      (stake * BigInt(4 * (daysStaked > 1 ? daysStaked - 1 : 0))) / 1461n;
  });
  votingPower = votingPower * BigInt(kycLevel > 2 ? 2 : kycLevel);
  return parseFloat(formatUnits(votingPower));
}
