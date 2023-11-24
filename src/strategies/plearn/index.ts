import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'plearnclub';
export const version = '0.0.1';

const lockedPoolabi = [
  'function userInfo(address) view returns (uint256 amount)'
];

const foundingInvestorPoolabi = [
  'function userInfo(address) view returns (uint256 initialAmount, uint256 amount)'
];

const pendingWithdrawalabi = [
  'function lockedBalances(address user) view returns (uint256 total, uint256 unlockable, uint256 locked, tuple(uint256 amount, uint256 unlockTime)[] lockData)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const score = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  const lockedPoolCalls = options.lockedPoolAddresses.flatMap((item) =>
    addresses.map((address) => [
      item.address,
      'userInfo',
      [address],
      { blockTag }
    ])
  );

  const foundingInvestorPoolCalls =
    options.foundingInvestorPoolAddresses.flatMap((item) =>
      addresses.map((address) => [
        item.address,
        'userInfo',
        [address],
        { blockTag }
      ])
    );

  const pendingWithdrawalCalls = options.pendingWithdrawalAddresses.flatMap(
    (item) =>
      addresses.map((address) => [
        item.address,
        'lockedBalances',
        [address],
        { blockTag }
      ])
  );

  const [
    lockedPoolBalancesRes,
    foundingInvestorPoolBalancesRes,
    pendingWithdrawalBalancesRes
  ] = await Promise.all([
    multicall(network, provider, lockedPoolabi, lockedPoolCalls, { blockTag }),
    multicall(
      network,
      provider,
      foundingInvestorPoolabi,
      foundingInvestorPoolCalls,
      { blockTag }
    ),
    multicall(network, provider, pendingWithdrawalabi, pendingWithdrawalCalls, {
      blockTag
    })
  ]);

  const calculateScore = (res, poolAddresses, balanceKey = 'amount') =>
    addresses.reduce((acc, address, index) => {
      acc[address] =
        (acc[address] || 0) +
        poolAddresses.reduce((poolAcc, pool, poolIndex) => {
          const callIndex = poolIndex * addresses.length + index;
          const balance = res[callIndex];

          if (balance && balance[balanceKey]) {
            return (
              poolAcc +
              parseFloat(
                formatUnits(balance[balanceKey].toString(), pool.decimals)
              )
            );
          } else {
            console.error(`Balance not found for callIndex: ${callIndex}`);
            return poolAcc;
          }
        }, 0);
      return acc;
    }, {});

  const lockedPoolScore = calculateScore(
    lockedPoolBalancesRes,
    options.lockedPoolAddresses
  );
  const foundingInvestorPoolScore = calculateScore(
    foundingInvestorPoolBalancesRes,
    options.foundingInvestorPoolAddresses
  );
  const pendingWithdrawalScore = calculateScore(
    pendingWithdrawalBalancesRes,
    options.pendingWithdrawalAddresses,
    'total'
  );

  const finalScore = Object.keys(score).reduce((acc, address) => {
    acc[address] =
      score[address] +
      lockedPoolScore[address] +
      foundingInvestorPoolScore[address] +
      pendingWithdrawalScore[address];
    return acc;
  }, {});

  return finalScore;
}
