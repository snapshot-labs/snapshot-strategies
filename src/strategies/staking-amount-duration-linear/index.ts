import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'defactor';
export const version = '0.1.0';

const abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'user',
        type: 'address'
      }
    ],
    name: 'getUserStakes',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'claimed',
            type: 'uint256'
          },
          {
            internalType: 'uint48',
            name: 'stakeTime',
            type: 'uint48'
          },
          {
            internalType: 'uint8',
            name: 'planId',
            type: 'uint8'
          },
          {
            internalType: 'bool',
            name: 'unstaked',
            type: 'bool'
          }
        ],
        internalType: 'struct IStaking.Stake[]',
        name: '',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
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
            power +=
              parseFloat(formatUnits(stake.amount, options.decimals)) *
              duration;
          }
        }
      });

      return [address, power];
    })
  );
}
