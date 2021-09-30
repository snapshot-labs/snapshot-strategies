import { multicall } from '../../utils';

export const author = 'avanyan';
export const version = '0.1.0';

const tokenAbi = [
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_lpToken',
        type: 'address'
      },
      {
        internalType: 'address',
        name: '_account',
        type: 'address'
      }
    ],
    name: 'getUser',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256'
          },
          {
            internalType: 'uint256[]',
            name: 'rewardsWriteoffs',
            type: 'uint256[]'
          }
        ],
        internalType: 'struct IBonusRewards.User',
        name: '',
        type: 'tuple'
      },
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const res = await multicall(
    network,
    provider,
    tokenAbi,
    [
      [options.joePoolAddress, 'totalSupply', []],
      [options.tokenAddress, 'balanceOf', [options.joePoolAddress]]
    ].concat(
      addresses.map((address: any) => [
        options.stakingAddress,
        'getUser',
        [options.joePoolAddress, address]
      ])
    ),
    { blockTag }
  );

  const totalSupply = res[0];
  const tokenBalanceInLP = res[1];
  const tokensPerLP =
    tokenBalanceInLP / 10 ** options.decimals / (totalSupply / 1e18);

  const response = res.slice(2);

  return Object.fromEntries(
    response.map(([userInfo], i) => [
      addresses[i],
      (userInfo.amount / 10 ** options.decimals) * tokensPerLP
    ])
  );
}
