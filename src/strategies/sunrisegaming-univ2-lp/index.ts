import { multicall } from '../../utils';
import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'sunrisedao';
export const version = '0.1.0';

const erc20Abi = [
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)'
];

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

  // Get LP balances
  let res = await multicall(
    network,
    provider,
    erc20Abi,
    [
      [options.lpTokenAddress, 'totalSupply', []],
      [options.tokenAddress, 'balanceOf', [options.lpTokenAddress]],
      ...addresses.map((address: any) => [
        options.lpTokenAddress,
        'balanceOf',
        [address]
      ])
    ],
    { blockTag }
  );

  const lpTokenTotalSupply = bn(res[0]); // decimal: 18
  const totalTokensInPool = bn(res[1]); // decimal: options.decimal

  res = res.slice(2);

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

  // How much tokens user has from LP tokens
  const usersTokensFromLp = res.slice(0, addresses.length).map((amount, i) => {
    const totalLp = bn(amount).add(bn(stakedRes[i].amount)); // decimal: 18

    // (LP + StakedLP) x token.balanceOf(LPToken) / LPToken.totalSupply()
    return totalLp.mul(totalTokensInPool).div(lpTokenTotalSupply); // decimal: options.decimal
  });

  return Object.fromEntries(
    usersTokensFromLp.map((sum, i) => {
      const parsedSum = parseFloat(formatUnits(sum, options.decimal));
      return [addresses[i], parsedSum];
    })
  );
}
