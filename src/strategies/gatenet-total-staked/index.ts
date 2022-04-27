import { Multicaller, subgraphRequest } from '../../utils';
import abis from './abis/Compound';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'usagar80';
export const version = '0.0.1';

const UNSTAKE = 'Unstake';
const STAKE = 'Stake';
const FEE_DISTRIBUTION = 'Fee distribution';
const REWARD_ADDED = 'Reward';
const CLAIM = 'Claim';
const OTHERS = 'others';

const abi = abis;

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
  addresses.forEach((address) => {
    multi.call('lockPeriod', options.address, 'LOCK_PERIOD');
  });
  const multiResult = await multi.execute();
  const lockPeriod = Number(multiResult.lockPeriod);

  const result = {};
  for (const address of addresses) {
    console.log(address);
    const args: {
      where: { sender: string };
    } = {
      where: {
        sender: address
      }
    };

    const query = {
      compoundDeposits: {
        __args: args,
        id: true,
        sender: true,
        amount: true,
        shares: true,
        time: true
      },
      compoundWithdraws: {
        __args: args,
        id: true,
        sender: true,
        amount: true,
        shares: true,
        time: true
      },
      stakings: {
        id: true,
        txName: true,
        amount: true,
        user: true,
        time: true,
        unStakeIndex: true
      }
    };
    const transactionsList = await subgraphRequest(
      'https://api.studio.thegraph.com/query/17252/gatenet-cvm/v0.6.1',
      query
    );
    console.log(transactionsList);
    let feePerShare = BigNumber.from(0);
    let rewardRate = BigNumber.from(0);
    let waitingFees = BigNumber.from(0);
    let waitingRewards = BigNumber.from(0);
    let currentShares = BigNumber.from(0);
    let transactionTypeTemp = '';
    let sign = '~';

    const rawTransactions = transactionsList.compoundDeposits
      .concat(transactionsList.compoundWithdraws)
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
              sign = '+';
              break;
            }

            case FEE_DISTRIBUTION: {
              const totalShares = BigNumber.from(transaction.unStakeIndex);
              const transactionAmount = BigNumber.from(transaction.amount);
              const previousFeePerShare = feePerShare;
              /// 0
              feePerShare = previousFeePerShare.add(
                transactionAmount.mul('1e18').div(totalShares)
              );
              // 0
              amount = currentShares.mul(
                feePerShare.sub(previousFeePerShare).div('1e18')
              );
              waitingFees = waitingFees.add(amount);
              sign = '+';
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
              sign = '+';
              break;
            }
            case UNSTAKE: {
              currentShares = currentShares.sub(
                BigNumber.from(transaction.shares || 0)
              );
              amount = BigNumber.from(transaction.amount);
              sign = '-';
              break;
            }
            case 'Claim': {
              if (transaction.user.toUpperCase() === address.toUpperCase()) {
                if (transactionTypeTemp !== UNSTAKE) {
                  amount = BigNumber.from(transaction.amount);
                  sign = '-';
                }
              }
              break;
            }
          }
          transactionTypeTemp = type;
          //          amount = amount.toNumber();
          return amount
            ? {
                name: type,
                timeStamp: transaction.time,
                time: new Date(transaction.time * 1000).toLocaleTimeString(),
                amount,
                date: new Date(transaction.time * 1000).toLocaleString(
                  'en-GB',
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }
                ),
                sign
              }
            : null;
        }
      })
      .filter((transaction) => transaction)
      .reverse();
    // Copied Content Start
    const firstUnstakeIndex = transactions.findIndex(
      (x) => x.name === 'Unstake'
    );
    let filtered = transactions;
    if (firstUnstakeIndex >= 0)
      filtered = transactions.slice(0, firstUnstakeIndex);
    const stake = filtered
      .filter((t) => t.name === 'Stake')
      .reduce((acc, transaction) => {
        return acc + transaction.amount;
      }, 0);
    const firstUnstaked = transactions[firstUnstakeIndex];
    let lockedTransaction = transactions
      .slice(firstUnstakeIndex)
      .filter(
        (t) =>
          firstUnstaked &&
          firstUnstaked.timeStamp - t.timeStamp <= lockPeriod &&
          t.name === 'Stake'
      )
      .reduce((acc, t) => (acc += Number(t.amount)), 0);
    if (!lockedTransaction) lockedTransaction = 0;

    console.log(stake);
    console.log(lockedTransaction);
    result[address] = stake + lockedTransaction;
    // Copied Content End
    //gatenet-total-staked
  }

  console.log(result);

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      Number(balance)
    ])
  );
}
