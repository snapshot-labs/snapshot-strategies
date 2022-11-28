import { BigNumber } from '@ethersproject/bignumber';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { formatUnits } from '@ethersproject/units';
import { Multicaller, call } from '../../utils';

export const author = '0xSkly';
export const version = '0.1.0';

const abi = [
  'function relicPositionsOfOwner(address owner) view returns (uint256[] relicIds, tuple(uint256 amount, uint256 rewardDebt, uint256 rewardCredit, uint256 entry, uint256 poolId, uint256 level, uint256 genesis, uint256 lastMaturityBonus)[] positionInfos)',
  'function getLevelInfo(uint256 pid) view returns (tuple(uint256[] requiredMaturity, uint256[] allocPoint, uint256[] balance) levelInfo)',
  'function levelOnUpdate(uint256 relicId) view returns (uint256 level)'
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
