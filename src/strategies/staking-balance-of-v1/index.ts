import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';

export const author = 'propchain-development';
export const version = '0.1.0';

const vestingABI = [
  'function getUserInfo(uint256 _pid, address _account) view returns (uint256 amount, uint256 totalRedeemed, uint256 lastClaimTimestamp, uint256 depositTimestamp)',
  'function getPoolInfo(uint256 _pid) view returns (uint256 startTime, address rewardsToken, address penaltyWallet, uint256 apyPercent, uint256 totalStaked, bool active, uint256 claimTimeLimit, uint256 penaltyFee, uint256 penaltyTimeLimit, bool isVIPPool)'
];

interface Options {
  staking_contract: string;
  pid_1: string;
  pid_2?: string;
  pid_3?: string;
  maxTimeInPool: BigNumberish;
  decimals: number;
}

interface PoolInfo {
  startTime: BigNumberish;
  rewardsToken: string;
  penaltyWallet: string;
  apyPercent: BigNumberish;
  totalStaked: BigNumberish;
  active: boolean;
  claimTimeLimit: BigNumberish;
  penaltyFee: BigNumberish;
  penaltyTimeLimit: BigNumberish;
  isVIPPool: boolean;
}

interface UserProperties {
  amount: BigNumberish;
  totalRedeemed: BigNumberish;
  lastClaimTimestamp: BigNumberish;
  depositTimestamp: BigNumberish;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options: Options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, vestingABI, { blockTag });

  multi.call(options.pid_1, options.staking_contract, 'getPoolInfo', [
    options.pid_1
  ]);
  if (options.pid_2)
    multi.call(options.pid_2, options.staking_contract, 'getPoolInfo', [
      options.pid_2
    ]);
  if (options.pid_3)
    multi.call(options.pid_3, options.staking_contract, 'getPoolInfo', [
      options.pid_3
    ]);

  const poolRecords: Record<string, PoolInfo> = await multi.execute();

  addresses.forEach((address: string) => {
    if (poolRecords[options.pid_1].active) {
      multi.call(
        address + '_' + options.pid_1,
        options.staking_contract,
        'getUserInfo',
        [options.pid_1, address]
      );
    }
    if (options.pid_2 && poolRecords[options.pid_2].active)
      multi.call(
        address + '_' + options.pid_2,
        options.staking_contract,
        'getUserInfo',
        [options.pid_2, address]
      );
    if (options.pid_3 && poolRecords[options.pid_3].active)
      multi.call(
        address + '_' + options.pid_3,
        options.staking_contract,
        'getUserInfo',
        [options.pid_3, address]
      );
  });
  const userProperties: Record<string, UserProperties> = await multi.execute();

  const filteredRecords: Record<string, number> = {};
  Object.entries(userProperties).forEach(([identifier, user]) => {
    const [addr, pid] = identifier.split('_');
    const poolInfo: PoolInfo = poolRecords[pid];

    if (!filteredRecords[addr]) filteredRecords[addr] = 0;

    if (!poolInfo.active) return;
    if (parseInt(pid) === 0) return;

    const weight =
      BigNumber.from(poolInfo.penaltyTimeLimit).toNumber() /
      BigNumber.from(options.maxTimeInPool).toNumber();
    const votingPower =
      parseFloat(formatUnits(user.amount, options.decimals)) * weight;

    filteredRecords[addr] += votingPower;
  });

  return filteredRecords;
}
