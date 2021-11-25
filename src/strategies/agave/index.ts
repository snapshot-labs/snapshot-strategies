import { formatUnits } from '@ethersproject/units';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { call } from '../../utils';

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
  const [
    availableLiquidity,
    lpTokenTotalSupply,
    lpTokenDecimals,
    underlyingTokenDecimals
  ] = await Promise.all([
    call(provider, abi, [
      options.underlyingToken,
      'balanceOf',
      [options.lpToken],
      { blockTag }
    ]),
    call(provider, abi, [options.lpToken, 'totalSupply'], { blockTag }),
    call(provider, abi, [options.lpToken, 'decimals']),
    call(provider, abi, [options.underlyingToken, 'decimals'])
  ]);

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
