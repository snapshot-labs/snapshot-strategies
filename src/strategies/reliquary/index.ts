import { BigNumber } from '@ethersproject/bignumber';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { formatUnits } from '@ethersproject/units';
import { Multicaller, call } from '../../utils';

export const author = 'beethovenx';
export const version = '0.1.0';

const abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function',
    name: 'relicPositionsOfOwner',
    outputs: [
      {
        internalType: 'uint256[]',
        name: 'relicIds',
        type: 'uint256[]'
      },
      {
        internalType: 'struct PositionInfo[]',
        name: 'positionInfos',
        type: 'tuple[]',
        components: [
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'rewardDebt',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'rewardCredit',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'entry',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'poolId',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'level',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'genesis',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'lastMaturityBonus',
            type: 'uint256'
          }
        ]
      }
    ]
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'pid',
        type: 'uint256'
      }
    ],
    name: 'getLevelInfo',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256[]',
            name: 'requiredMaturity',
            type: 'uint256[]'
          },
          {
            internalType: 'uint256[]',
            name: 'allocPoint',
            type: 'uint256[]'
          },
          {
            internalType: 'uint256[]',
            name: 'balance',
            type: 'uint256[]'
          }
        ],
        internalType: 'struct LevelInfo',
        name: 'levelInfo',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'relicId',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function',
    name: 'levelOnUpdate',
    outputs: [
      {
        internalType: 'uint256',
        name: 'level',
        type: 'uint256'
      }
    ]
  }
];

export async function strategy(
  space: string,
  network: string,
  provider: StaticJsonRpcProvider,
  addresses: string[],
  options: {
    reliquaryAddress: string;
    poolId: number;
    minVotingLevel: number;
    maxVotingLevel: number;
    decimals?: number;
    strategy: 'level' | 'allocationPoints';
    useLevelOnUpdate?: boolean;
  },
  snapshot?: number | string
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });

  for (let address of addresses) {
    multi.call(address, options.reliquaryAddress, 'relicPositionsOfOwner', [
      address
    ]);
  }

  // first we get all relics for each voter
  const relicPositionsByOwner: Record<
    string,
    [
      BigNumber[], //relicIds
      {
        amount: BigNumber;
        rewardDebt: BigNumber;
        rewardCredit: BigNumber;
        entry: BigNumber;
        poolId: BigNumber;
        level: BigNumber;
        genesis: BigNumber;
        lastMaturityBonus: BigNumber;
      }[] // correlating positions
    ]
  > = await multi.execute();

  // then we filter by the configured pool ID
  const relevantRelicPositions = Object.entries(relicPositionsByOwner).flatMap(
    ([owner, [relicIds, positions]]) =>
      positions
        .map((position, index) => ({
          owner,
          relicId: relicIds[index].toNumber(),
          poolId: position.poolId.toNumber(),
          amount: position.amount,
          level: position.level.toNumber()
        }))
        .filter((position) => position.poolId === options.poolId)
  );

  // if the strategy should use the level on update, we override the level
  if (options.useLevelOnUpdate) {
    for (let relicPosition of relevantRelicPositions) {
      multi.call(
        `${relicPosition.owner}.${relicPosition.relicId}.level`,
        options.reliquaryAddress,
        'levelOnUpdate',
        [relicPosition.relicId]
      );
    }

    const relicLevelByVoterAndRelic: {
      [owner: string]: {
        [relicId: string]: { level: BigNumber };
      };
    } = await multi.execute();

    for (let relicPosition of relevantRelicPositions) {
      relicPosition.level =
        relicLevelByVoterAndRelic[relicPosition.owner][
          relicPosition.relicId
        ].level.toNumber();
    }
  }

  const userVotingPower: Record<string, number> = {};

  /*  
    if we use the level strategy, we just add the level as a multiplier in relation to the max level.
    So the formula used is: relicAmount * level / maxLevel
  */
  if (options.strategy === 'level') {
    for (let relicPosition of relevantRelicPositions) {
      const multiplier =
        relicPosition.level >= options.minVotingLevel
          ? Math.min(options.maxVotingLevel, relicPosition.level)
          : 0;
      const votingPower = parseFloat(
        formatUnits(
          relicPosition.amount.mul(multiplier).div(options.maxVotingLevel),
          options.decimals ?? 18
        )
      );

      if (relicPosition.owner in userVotingPower) {
        userVotingPower[relicPosition.owner] += votingPower;
      } else {
        userVotingPower[relicPosition.owner] = votingPower;
      }
    }

    return userVotingPower;
  }
  /*
    otherwise we use the level allocations to weight the voting power. For this
    we need to get the allocations for each level for the configured pool.
    The formula used is: relicAmount * levelAllocation / maxAllocation

  */

  const poolLevelInfo: {
    requiredMaturity: BigNumber[];
    allocPoint: BigNumber[];
    balance: BigNumber[];
  } = await call(
    provider,
    abi,
    [options.reliquaryAddress, 'getLevelInfo', [options.poolId]],
    { blockTag }
  );

  const maxLevelAllocation = poolLevelInfo.allocPoint[options.maxVotingLevel];

  for (let relicPosition of relevantRelicPositions) {
    const multiplier =
      poolLevelInfo.allocPoint[
        Math.min(options.maxVotingLevel, relicPosition.level)
      ].toNumber();

    const votingPower = parseFloat(
      formatUnits(
        relicPosition.amount.mul(multiplier).div(maxLevelAllocation),
        options.decimals ?? 18
      )
    );

    if (relicPosition.owner in userVotingPower) {
      userVotingPower[relicPosition.owner] += votingPower;
    } else {
      userVotingPower[relicPosition.owner] = votingPower;
    }
  }
  return userVotingPower;
}
