import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller, multicall } from '../../utils';

export const author = 'JustinPosition';
export const version = '0.0.1';

const abi = [
  'function balanceOf(address account) external view returns (uint256)'
];

const stakeManagerAbi = [
  'function userInfo(uint256, address) view returns (uint256 amount, uint256 rewardDebt)'
];

const nftStakingPoolAbi = [
  'function balanceOf(address account) view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) => {
    return multi.call(address, options.address, 'balanceOf', [address]);
  });

  const nftStakingBalances = await multicall(
    network,
    provider,
    nftStakingPoolAbi,
    addresses.map((address) => [
      options.nftStakingPoolAddress,
      'balanceOf',
      [address]
    ]),
    { blockTag }
  );
  const stakeBalances = await multicall(
    network,
    provider,
    stakeManagerAbi,
    addresses.map((address: any) => [
      options.stakeManagerAddress,
      'userInfo',
      ['0', address]
    ]),
    { blockTag }
  );

  const result: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, balance], index) => {
      return [
        address,
        parseFloat(
          formatUnits(nftStakingBalances[index][0], options.decimals)
        ) +
          parseFloat(
            formatUnits(stakeBalances[index].amount, options.decimals)
          ) +
          parseFloat(formatUnits(balance, options.decimals))
      ];
    })
  );
}
