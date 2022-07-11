import { Multicaller, subgraphRequest } from '../../utils';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';

export const author = 'usagar80';
export const version = '0.0.2';

const UNSTAKE = 'Unstake';
const STAKE = 'Stake';
const FEE_DISTRIBUTION = 'Fee distribution';
const REWARD_ADDED = 'Reward';
const CLAIM = 'Claim';
const OTHERS = 'others';

const abi = ['function LOCK_PERIOD() view returns (uint256)'];

const getTransactionType = (transaction) => {
  switch (transaction.__typename) {
    case 'Staking':
      if (transaction.txName === 'FeeDistribution') {
        return FEE_DISTRIBUTION;
      } else if (transaction.txName === 'RewardAdded') {
        return REWARD_ADDED;
      } else if (transaction.txName === 'Claim') {
        return CLAIM;
      }
      return OTHERS;
    case 'CompoundDeposit':
      return STAKE;
    default:
      return UNSTAKE;
  }
};

//gatenet-total-staked
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
  multi.call('lockPeriod', options.address, 'LOCK_PERIOD');
  const multiResult = await multi.execute();
  const lockPeriod = Number(multiResult.lockPeriod);
  const result: Record<string, BigNumberish> = {};
  const args = {
    where: {
      sender_in: addresses
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    args.where.time_lte = (await provider.getBlock(snapshot)).timestamp;
  }

  const query = {
    compoundDeposits: {
      __args: args,
      __typename: true,
      id: true,
      sender: true,
      amount: true,
      shares: true,
      time: true
    },
    compoundWithdraws: {
      __args: args,
      __typename: true,
      id: true,
      sender: true,
      amount: true,
      shares: true,
      time: true
    },
    stakings: {
      __typename: true,
      id: true,
      txName: true,
      amount: true,
      user: true,
      time: true,
      unStakeIndex: true
    }
  };
  const transactionsList = await subgraphRequest(options.subgraph, query);

  for (const address of addresses) {
    let feePerShare = BigNumber.from(0);
    let rewardRate = BigNumber.from(0);
    let waitingFees = BigNumber.from(0);
    let waitingRewards = BigNumber.from(0);
    let currentShares = BigNumber.from(0);
    let transactionTypeTemp = '';
    const ether = BigNumber.from(10).pow(18);

    const compoundDeposits = transactionsList.compoundDeposits.filter(
      (s) => s.sender.toLowerCase() === address.toLowerCase()
    );
    const compoundWithdraws = transactionsList.compoundWithdraws.filter(
      (s) => s.sender.toLowerCase() === address.toLowerCase()
    );

    if (compoundWithdraws.length > 0 && compoundDeposits.length > 0) {
      const rawTransactions = compoundDeposits
        .concat(compoundWithdraws)
        .concat(transactionsList.stakings)
        .sort(function (a, b) {
          return a.time - b.time;
        });
      const transactions = rawTransactions
        .map((transaction) => {
          const type = getTransactionType(transaction);
          if (type !== OTHERS) {
            let amount;
            switch (type) {
              case STAKE: {
                currentShares = BigNumber.from(transaction.shares).add(
                  currentShares
                );
                amount = BigNumber.from(transaction.amount);
                break;
              }

              case FEE_DISTRIBUTION: {
                const totalShares = BigNumber.from(transaction.unStakeIndex);
                const transactionAmount = BigNumber.from(transaction.amount);
                const previousFeePerShare = feePerShare;
                /// 0
                feePerShare = previousFeePerShare.add(
                  transactionAmount.mul(ether).div(totalShares)
                );
                // 0
                amount = currentShares.mul(
                  feePerShare.sub(previousFeePerShare).div(ether)
                );
                waitingFees = waitingFees.add(amount);
                break;
              }

              case REWARD_ADDED: {
                const rewardRateIncrease = BigNumber.from(
                  transaction.unStakeIndex
                );
                const previousRewardRate = rewardRate;
                rewardRate = rewardRate
                  .add(rewardRateIncrease)
                  .add(previousRewardRate);

                amount = currentShares.mul(rewardRate.sub(previousRewardRate));
                waitingRewards = waitingRewards.add(amount);
                break;
              }
              case UNSTAKE: {
                currentShares = currentShares.sub(
                  BigNumber.from(transaction.shares || 0)
                );
                amount = BigNumber.from(transaction.amount);
                break;
              }
              case 'Claim': {
                if (transaction.user.toUpperCase() === address.toUpperCase()) {
                  if (transactionTypeTemp !== UNSTAKE) {
                    amount = BigNumber.from(transaction.amount);
                  }
                }
                break;
              }
            }
            transactionTypeTemp = type;
            return amount
              ? {
                  name: type,
                  timeStamp: transaction.time,
                  amount
                }
              : null;
          }
        })
        .filter((transaction) => transaction)
        .reverse();
      // Copied Content Start
      const firstUnstakeIndex = transactions.findIndex(
        (x) => x.name === UNSTAKE
      );
      let filtered = transactions;
      if (firstUnstakeIndex >= 0)
        filtered = transactions.slice(0, firstUnstakeIndex);
      const stake: BigNumberish = filtered
        .filter((t) => t.name === STAKE)
        .reduce((acc: BigNumberish, transaction) => {
          return BigNumber.from(transaction.amount).add(acc);
        }, BigNumber.from(0));
      const firstUnstaked = transactions[firstUnstakeIndex];
      let lockedTransaction: BigNumberish = transactions
        .slice(firstUnstakeIndex)
        .filter(
          (t) =>
            firstUnstaked &&
            firstUnstaked.timeStamp - t.timeStamp <= lockPeriod &&
            t.name === STAKE
        )
        .reduce((acc: BigNumberish, t) => {
          return BigNumber.from(t.amount).add(acc);
        }, BigNumber.from(0));
      if (!lockedTransaction) lockedTransaction = 0;

      result[address] = BigNumber.from(0).add(stake).add(lockedTransaction);
    } else {
      result[address] = BigNumber.from(0);
    }
  }
  const score = Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );

  Object.keys(score).forEach((key) => {
    if (score[key] >= (options.minBalance || 0)) score[key] = score[key];
    else score[key] = 0;
  });

  return score;
}
