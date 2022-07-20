import { call } from '../../utils';
import { formatUnits } from '@ethersproject/units';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'RaiNFall';
export const version = '1.0.0';

const erc20ABI = [
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
  const scores = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const oneLPTokenValue = (10**options.decimals).toString();
  const underlyingValue = await call(
    provider,
    erc20ABI,
    [options.bancorNetworkInfoAddress, 'poolTokenToUnderlying', [options.underlyingTokenAddress, oneLPTokenValue]],
    { blockTag }
  ).then((res) => parseFloat(formatUnits(res, options.decimals)));

  return Object.fromEntries(
    Object.entries(scores).map((res: any) => [res[0], res[1] * options.weight * underlyingValue])
  );
}
