import { multicall } from '../../utils';
import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'capitaldao';
export const version = '0.1.0';

const masterChefAbi = [
  'function pools(uint256) view returns (address token, uint256 allocPoint, uint256 lastRewardBlock, uint256 rewardPerShare, uint256 lockTime, uint256 totalStaked)'
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
        'pools',
        [options.poolIndex]
      ])
    ],
    { blockTag }
  );
  
  return Object.fromEntries(
    response.map((pool, i) => {
      const parsedAmount = parseFloat(
        formatUnits(bn(pool.totalStaked), options.decimal)
      );
      return [addresses[i], parsedAmount];
    })
  );
}
