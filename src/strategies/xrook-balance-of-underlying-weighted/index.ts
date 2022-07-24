import { call } from '../../utils';
import { formatUnits } from '@ethersproject/units';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'TudorSante';
export const version = '1.0.0';

const erc20ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const score = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const xROOKTotalSupply = await call(
    provider,
    erc20ABI,
    [options.address, 'totalSupply', []],
    { blockTag }
  ).then((res) => parseFloat(formatUnits(res, options.decimals)));

  const liquidityPoolBalance = await call(
    provider,
    erc20ABI,
    [
      options.underlyingTokenAddress,
      'balanceOf',
      [options.liquidityPoolAddress]
    ],
    { blockTag }
  ).then((res) => parseFloat(formatUnits(res, options.decimals)));

  const underlyingValue = liquidityPoolBalance / xROOKTotalSupply;

  return Object.fromEntries(
    Object.entries(score).map((res: any) => [
      res[0],
      res[1] * options.weight * underlyingValue
    ])
  );
}
