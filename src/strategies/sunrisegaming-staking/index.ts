import { multicall } from '../../utils';
import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'sunrisedao';
export const version = '0.1.0';

const masterChefAbi = [
  'function userInfo(uint256, address) view returns (uint256 amount, uint256 rewardDebt)'
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
  const stakedRes = await multicall(
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
      const parsedAmount = parseFloat(
        formatUnits(bn(stakedInfo.amount), options.decimal)
      );
      return [addresses[i], parsedAmount];
    })
  );
}
