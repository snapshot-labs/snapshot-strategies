import { strategy as balancerPoolIdStrategy } from '../balancer-poolid';
import { BigNumberish } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';
import { formatUnits } from '@ethersproject/units';

export const author = 'mwamedacen';
export const version = '0.1.0';

interface Options {
  balancerPoolId: string;
  safetyModule: {
    address: string;
    decimals: number;
  };
  votingToken: {
    address: string;
    decimals: number;
  };
}

type FetchSafetyModuleScoreOutput = Promise<number>;

async function fetchSafetyModuleScore(
  space: string,
  network: string,
  provider,
  addresses: string[],
  options: Options,
  snapshot: number
): FetchSafetyModuleScoreOutput {
  const scores = await balancerPoolIdStrategy(
    space,
    network,
    provider,
    [options.safetyModule.address],
    {
      poolId: options.balancerPoolId,
      token: options.votingToken.address
    },
    snapshot
  );

  return parseFloat(scores[options.safetyModule.address]);
}

const SafetyModuleMinABI = [
  'function totalSupply() external view returns (uint256)',
  'function STAKED_TOKEN() external view returns (address)',
  'function REWARD_TOKEN() external view returns (address)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address account) external view returns (uint256)',
  'function getTotalRewardsBalance(address staker) view returns (uint256)'
];

const TOTAL_SUPPLY_ATTR = 'totalSupply';
const STAKED_TOKEN_ATTR = 'stakedToken';
const REWARD_TOKEN_ATTR = 'rewardToken';
const BALANCE_OF_ATTR = 'balanceOf';
const REWARDS_OF_ATTR = 'totalRewardsBalance';

type FetchAccountsSafetyModuleStakesAndRewardsOuput = Promise<{
  [address: string]: {
    [BALANCE_OF_ATTR]: BigNumberish;
    [REWARD_TOKEN_ATTR]: BigNumberish;
  };
}>;

async function fetchAccountsSafetyModuleStakesAndRewards(
  space: string,
  network: string,
  provider,
  addresses: string[],
  options: Options,
  snapshot: number
): FetchAccountsSafetyModuleStakesAndRewardsOuput {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, SafetyModuleMinABI, {
    blockTag
  });

  addresses.forEach((address) => {
    multi.call(
      `${BALANCE_OF_ATTR}_${address}`,
      options.safetyModule.address,
      'balanceOf',
      [address]
    );
    multi.call(
      `${REWARDS_OF_ATTR}_${address}`,
      options.safetyModule.address,
      'getTotalRewardsBalance',
      [address]
    );
  });

  const result: Record<string, BigNumberish> = await multi.execute();

  return Object.entries(result).reduce((acc, [key, value]) => {
    const [attr, addr] = key.split('_');

    if (!acc[addr]) {
      acc[addr] = {};
    }

    acc[addr][attr] = value;

    return acc;
  }, {});
}

type FetchSafetyModuleGlobalStateOutput = Promise<{
  [TOTAL_SUPPLY_ATTR]: BigNumberish;
  [REWARD_TOKEN_ATTR]: string;
  [STAKED_TOKEN_ATTR]: string;
}>;

async function fetchSafetyModuleGlobalState(
  space: string,
  network: string,
  provider,
  addresses: string[],
  options: Options,
  snapshot: number
): FetchSafetyModuleGlobalStateOutput {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, SafetyModuleMinABI, {
    blockTag
  });

  multi.call(STAKED_TOKEN_ATTR, options.safetyModule.address, 'STAKED_TOKEN');
  multi.call(REWARD_TOKEN_ATTR, options.safetyModule.address, 'REWARD_TOKEN');
  multi.call(TOTAL_SUPPLY_ATTR, options.safetyModule.address, 'totalSupply');

  const result: {
    [STAKED_TOKEN_ATTR]: string;
    [REWARD_TOKEN_ATTR]: string;
    [TOTAL_SUPPLY_ATTR]: BigNumberish;
  } = await multi.execute();

  return result;
}

export async function strategy(
  space: string,
  network: string,
  provider,
  addresses: string[],
  options: Options,
  snapshot: number
) {
  const [safetyModuleScore, accountsStakesAndRewards, safetyModuleGlobalState] =
    await Promise.all(
      [
        fetchSafetyModuleScore,
        fetchAccountsSafetyModuleStakesAndRewards,
        fetchSafetyModuleGlobalState
      ].map((fn) =>
        fn(space, network, provider, addresses, options, snapshot)
      ) as [
        FetchSafetyModuleScoreOutput,
        FetchAccountsSafetyModuleStakesAndRewardsOuput,
        FetchSafetyModuleGlobalStateOutput
      ]
    );

  const safetyModuleStakedToken = safetyModuleGlobalState[STAKED_TOKEN_ATTR];

  if (
    safetyModuleStakedToken.toLowerCase() !==
    options.balancerPoolId.substring(0, 42).toLowerCase()
  ) {
    throw new Error(
      `safety-module-bpt-power, safety module's staken token ${safetyModuleStakedToken} doesn't match balancer pool ${options.balancerPoolId}`
    );
  }

  const safetyModuleRewardsToken = safetyModuleGlobalState[REWARD_TOKEN_ATTR];

  const votingAndRewardTokenMatching =
    safetyModuleRewardsToken.toLowerCase() ===
    options.votingToken.address.toLowerCase();

  const safetyModuleTotalSupply = parseFloat(
    formatUnits(
      safetyModuleGlobalState[TOTAL_SUPPLY_ATTR],
      options.safetyModule.decimals
    )
  );

  const scores = Object.fromEntries(
    Object.entries(accountsStakesAndRewards).map(
      ([address, accountStakesAndRewards]) => {
        const accountSafetyModuleBalance = parseFloat(
          formatUnits(
            accountStakesAndRewards[BALANCE_OF_ATTR],
            options.safetyModule.decimals
          )
        );

        const accountSharePercent =
          accountSafetyModuleBalance / safetyModuleTotalSupply;

        const accountStakedScore = accountSharePercent * safetyModuleScore;

        if (!votingAndRewardTokenMatching) {
          return [address, accountStakedScore];
        }

        const accountRewardsScore = parseFloat(
          formatUnits(
            accountStakesAndRewards[REWARDS_OF_ATTR],
            options.votingToken.decimals
          )
        );

        const accountStakedAndRewardsScore =
          accountStakedScore + accountRewardsScore;

        return [address, accountStakedAndRewardsScore];
      }
    )
  );

  return scores;
}
