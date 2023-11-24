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

  const maxAddresses = 5;
  const selectedLockedPoolAddresses = options.lockedPoolAddresses.slice(
    0,
    maxAddresses
  );
  const selectedFoundingInvestorPoolAddresses =
    options.foundingInvestorPoolAddresses.slice(0, maxAddresses);
  const selectedPendingWithdrawalAddresses =
    options.pendingWithdrawalAddresses.slice(0, maxAddresses);

  const lockedPoolBalances = await Promise.all(
    selectedLockedPoolAddresses.map((item) =>
      multicall(
        network,
        provider,
        lockedPoolabi,
        addresses.map((address: any) => [
          item.address,
          'userInfo',
          [address],
          { blockTag }
        ]),
        { blockTag }
      )
    )
  );

  const foundingInvestorPoolBalances = await Promise.all(
    selectedFoundingInvestorPoolAddresses.map((item) =>
      multicall(
        network,
        provider,
        foundingInvestorPoolabi,
        addresses.map((address: any) => [
          item.address,
          'userInfo',
          [address],
          { blockTag }
        ]),
        { blockTag }
      )
    )
  );

  const pendingWithdrawalBalances = await Promise.all(
    selectedPendingWithdrawalAddresses.map((item) =>
      multicall(
        network,
        provider,
        pendingWithdrawalabi,
        addresses.map((address: any) => [
          item.address,
          'lockedBalances',
          [address],
          { blockTag }
        ]),
        { blockTag }
      )
    )
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
