import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'plearnclub';
export const version = '0.0.1';

const lockedPoolabi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'userInfo',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

const foundingInvestorPoolabi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'userInfo',
    outputs: [
      {
        internalType: 'uint256',
        name: 'initialAmount',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

const pendingWithdrawalabi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'user',
        type: 'address'
      }
    ],
    name: 'lockedBalances',
    outputs: [
      {
        internalType: 'uint256',
        name: 'total',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'unlockable',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'locked',
        type: 'uint256'
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'unlockTime',
            type: 'uint256'
          }
        ],
        internalType: 'struct PendingWithdrawal.LockedBalance[]',
        name: 'lockData',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
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

  const lockedPoolBalances = await Promise.all(
    options.lockedPoolAddresses.map((item) =>
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
    options.foundingInvestorPoolAddresses.map((item) =>
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
    options.pendingWithdrawalAddresses.map((item) =>
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
