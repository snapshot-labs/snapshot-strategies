import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'jairsnowswap';
export const version = '0.1.0';

const stakedAbi = [
  'function balanceOf(address account) external view returns (uint256)'
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
  const { snowStakingAddress, decimals } = options;

  const snowBalances = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  const stakedTokenBalances = new Multicaller(network, provider, stakedAbi, {
    blockTag
  });

  addresses.forEach((address: string) =>
    stakedTokenBalances.call(address, snowStakingAddress, 'balanceOf', [
      address
    ])
  );
  const result: Record<string, number | BigNumberish> =
    await stakedTokenBalances.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, output]) => [
      address,
      parseFloat(formatUnits(output, decimals)) + snowBalances[address]
    ])
  );
}
