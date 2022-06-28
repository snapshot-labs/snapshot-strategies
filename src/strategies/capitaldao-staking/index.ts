import { multicall } from '../../utils';
import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'capitaldao';
export const version = '0.1.0';

const masterChefAbi = [
  'function users(uint256, address) view returns (uint256 amount, uint256 rewardDebt, uint256 lastDepositAt)'
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

  // Get staked LP in staking contract
  const response = await multicall(
    network,
    provider,
    masterChefAbi,
    [
      ...addresses.map((address: any) => [
        options.stakingAddress,
        'users',
        [options.poolIndex, address]
      ])
    ],
    { blockTag }
  );

  return Object.fromEntries(
    response.map((user, i) => {
      const parsedAmount = parseFloat(
        formatUnits(bn(user.amount), options.decimal)
      );
      return [addresses[i], parsedAmount];
    })
  );
}
