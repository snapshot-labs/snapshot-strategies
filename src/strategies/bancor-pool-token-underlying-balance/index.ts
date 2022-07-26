import { call } from '../../utils';
import { formatUnits } from '@ethersproject/units';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'TudorSante';
export const version = '1.0.0';

const erc20ABI = [
  'function poolToken(address pool) external view returns (address)',
  'function poolTokenToUnderlying(address pool, uint256 poolTokenAmount) external view returns (uint256)'
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

  const liquidityPoolTokenAddress = await call(
    provider,
    erc20ABI,
    [
      options.bancorNetworkInfoAddress,
      'poolToken',
      [options.underlyingTokenAddress]
    ],
    { blockTag }
  );

  options.address = liquidityPoolTokenAddress;
  const scores = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  const poolTokenDecimalScaling = (10 ** options.decimals).toString();
  const underlyingValue = await call(
    provider,
    erc20ABI,
    [
      options.bancorNetworkInfoAddress,
      'poolTokenToUnderlying',
      [options.underlyingTokenAddress, poolTokenDecimalScaling]
    ],
    { blockTag }
  ).then((res) => parseFloat(formatUnits(res, options.decimals)));

  return Object.fromEntries(
    Object.entries(scores).map((res: any) => [res[0], res[1] * underlyingValue])
  );
}
