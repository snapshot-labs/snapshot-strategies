import { formatUnits } from '@ethersproject/units';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { Multicaller } from '../../utils';

export const author = 'maxaleks';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function decimals() external view returns (uint256)'
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

  const multi = new Multicaller(network, provider, abi, { blockTag });
  multi.call('availableLiquidity', options.underlyingToken, 'balanceOf', [
    options.lpToken
  ]);
  multi.call('lpTokenTotalSupply', options.lpToken, 'totalSupply');
  multi.call('lpTokenDecimals', options.lpToken, 'decimals');
  multi.call('underlyingTokenDecimals', options.underlyingToken, 'decimals');
  const {
    availableLiquidity,
    lpTokenTotalSupply,
    lpTokenDecimals,
    underlyingTokenDecimals
  } = await multi.execute();

  const rate =
    parseFloat(formatUnits(availableLiquidity, underlyingTokenDecimals)) /
    parseFloat(formatUnits(lpTokenTotalSupply, lpTokenDecimals));

  const scores = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    {
      address: options.lpToken,
      decimals: lpTokenDecimals
    },
    snapshot
  );

  return Object.fromEntries(
    Object.entries(scores).map(([address, balance]) => [
      address,
      balance * rate
    ])
  );
}
