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

  const lockedPoolBalancesRes = await multicall(
    network,
    provider,
    lockedPoolabi,
    lockedPoolCalls,
    { blockTag }
  );

  const lockedPoolBalances = options.lockedPoolAddresses.map((_, poolIndex) =>
    addresses.map((_, addressIndex) => {
      const callIndex = poolIndex * addresses.length + addressIndex;
      return lockedPoolBalancesRes[callIndex];
    })
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

  const foundingInvestorPoolBalancesRes = await multicall(
    network,
    provider,
    foundingInvestorPoolabi,
    foundingInvestorPoolCalls,
    { blockTag }
  );

  const foundingInvestorPoolBalances =
    options.foundingInvestorPoolAddresses.map((_, poolIndex) =>
      addresses.map((_, addressIndex) => {
        const callIndex = poolIndex * addresses.length + addressIndex;
        return foundingInvestorPoolBalancesRes[callIndex];
      })
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

  const pendingWithdrawalBalancesRes = await multicall(
    network,
    provider,
    pendingWithdrawalabi,
    pendingWithdrawalCalls,
    { blockTag }
  );

  const pendingWithdrawalBalances = options.pendingWithdrawalAddresses.map(
    (_, poolIndex) =>
      addresses.map((_, addressIndex) => {
        const callIndex = poolIndex * addresses.length + addressIndex;
        return pendingWithdrawalBalancesRes[callIndex];
      })
  );

  return Object.fromEntries(
    Object.entries(score).map((address, index) => [
      address[0],
      address[1] +
        lockedPoolBalances.reduce(
          (prev: number, cur: any, idx: number) =>
            prev +
            parseFloat(
              formatUnits(
                cur[index].amount.toString(),
                options.lockedPoolAddresses[idx].decimals
              )
            ),
          0
        ) +
        foundingInvestorPoolBalances.reduce(
          (prev: number, cur: any, idx: number) =>
            prev +
            parseFloat(
              formatUnits(
                cur[index].amount.toString(),
                options.foundingInvestorPoolAddresses[idx].decimals
              )
            ),
          0
        ) +
        pendingWithdrawalBalances.reduce(
          (prev: number, cur: any, idx: number) =>
            prev +
            parseFloat(
              formatUnits(
                cur[index].total.toString(),
                options.pendingWithdrawalAddresses[idx].decimals
              )
            ),
          0
        )
    ])
  );
}
