import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'JanBajecDev';
export const version = '0.1.0';

const abi = [
  'function getUserStakes(address user) view returns (tuple(uint256 amount, uint256 claimed, uint48 stakeTime, uint8 planId, bool unstaked)[])'
];
const secondsInAMonth = 30.44 * 24 * 60 * 60;

interface Stake {
  amount: bigint;
  claimed: bigint;
  stakeTime: bigint;
  planId: bigint;
  unstaked: boolean;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const snapshotBlock = await provider.getBlock(blockTag);

  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    multi.call(address, options.address, 'getUserStakes', [address])
  );
  const result: Record<string, Stake[]> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, stakes]) => {
      let power = 0;
      stakes.forEach((stake) => {
        if (!stake.unstaked) {
          if (snapshotBlock.timestamp > stake.stakeTime) {
            const duration =
              Number(snapshotBlock.timestamp - stake.stakeTime) /
              secondsInAMonth;
            const durationRateCalculated = Math.pow(1 + options.rate, duration);
            power +=
              parseFloat(formatUnits(stake.amount, options.decimals)) *
              durationRateCalculated;
          }
        }
      });

      return [address, power];
    })
  );
}
