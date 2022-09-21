import { BigNumber } from '@ethersproject/bignumber';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'beethovenx';
export const version = '0.1.0';

type PositionInfo = {
  amount: BigNumber;
  rewardDebt: BigNumber;
  rewardCredit: BigNumber;
  entry: BigNumber;
  poolId: BigNumber;
  level: BigNumber;
};

/*
  TODO: add description
*/

const abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
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
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'index',
        type: 'uint256'
      }
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'relicId',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function',
    name: 'getPositionForId',
    outputs: [
      {
        internalType: 'struct PositionInfo',
        name: 'position',
        type: 'tuple',
        components: [
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'rewardDebt',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'rewardCredit',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'entry',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'poolId',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'level',
            type: 'uint256'
          }
        ]
      }
    ]
  }
];

export async function strategy(
  space: string,
  network: string,
  provider: StaticJsonRpcProvider,
  addresses: string[],
  options: {
    reliquaryAddress: string;
    poolId: number;
    maxVotingLevel: number;
    decimals?: number;
  },
  snapshot?: number | string
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });

  for (let address of addresses) {
    multi.call(address, options.reliquaryAddress, 'balanceOf', [address]);
  }

  // first we need to know how many relics an address owns
  const userBalances: Record<string, BigNumber> = await multi.execute();

  // then we can get all relict ids for those users
  for (let address of addresses) {
    for (
      let position = 0;
      position < userBalances[address].toNumber();
      position++
    ) {
      multi.call(
        `${address}[${position}]`,
        options.reliquaryAddress,
        'tokenOfOwnerByIndex',
        [address, position]
      );
    }
  }

  const userRelicts: Record<string, BigNumber[]> = await multi.execute();

  // with those relict ids, we can now get the positions of the relicts
  Object.entries(userRelicts).forEach(([address, relictIds]) => {
    Object.values(relictIds).forEach((relictId, index) => {
      multi.call(
        `${address}[${index}]`,
        options.reliquaryAddress,
        'getPositionForId',
        [relictId]
      );
    });
  });

  const userPositions: Record<string, PositionInfo[]> = await multi.execute();

  // now that we have all positions, we add up all position of the configured
  // pool weighted by the level of the position in relation to the maxVotingLevel
  const userAmounts: Record<string, number> = {};

  Object.entries(userPositions).forEach(([address, positions]) => {
    let amount = 0;
    for (let position of positions) {
      if (position.poolId.toNumber() === options.poolId) {
        amount +=
          (Math.min(position.level.toNumber() + 1, options.maxVotingLevel + 1) /
            (options.maxVotingLevel + 1)) *
          parseFloat(formatUnits(position.amount, options.decimals ?? 18));
      }
    }
    userAmounts[address] = amount;
  });

  return userAmounts;
}
