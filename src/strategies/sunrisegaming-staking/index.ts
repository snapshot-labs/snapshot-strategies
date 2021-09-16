import { multicall } from '../../utils';
import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'sunrisedao';
export const version = '0.1.0';

const masterChefAbi = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      },
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
      },
      {
        internalType: 'uint256',
        name: 'rewardDebt',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

function bn(num: any): BigNumber {
  return BigNumber.from(num.toString());
}

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // Get staked LP in staking constract
  let stakedRes = await multicall(
    network,
    provider,
    masterChefAbi,
    [
      ...addresses.map((address: any) => [
        options.stakingAddress,
        'userInfo',
        [options.poolIndex, address]
      ])
    ],
    { blockTag }
  );

  return Object.fromEntries(
    stakedRes.map((stakedInfo, i) => {
      const parsedAmount = parseFloat(formatUnits(bn(stakedInfo.amount), options.decimal));
      return [addresses[i], parsedAmount];
    })
  );
}
