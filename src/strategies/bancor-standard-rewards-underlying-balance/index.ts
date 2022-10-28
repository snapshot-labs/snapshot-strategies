import { formatUnits } from '@ethersproject/units';
import { BigNumberish } from '@ethersproject/bignumber';
import { call } from '../../utils';
import { Multicaller } from '../../utils';

export const author = 'tiagofilipenunes';
export const version = '0.1.0';

const bancorNetworkInfoABI = [
  'function poolTokenToUnderlying(address pool, uint256 poolTokenAmount) external view returns (uint256)'
];

const standardRewardsABI = [
  'function providerStake(address provider, uint256 id) external view returns (uint256)',
  'function latestProgramId(address pool) external view returns (uint256)'
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

  // Get last provider Program ID
  const latestProgramId = await call(
    provider,
    standardRewardsABI,
    [
      options.bancorStandardRewardsAddress,
      'latestProgramId',
      [options.underlyingTokenAddress]
    ],
    { blockTag }
  );

  // Get each provider's stake in the standard rewards contract
  const multi = new Multicaller(network, provider, standardRewardsABI, {
    blockTag
  });
  addresses.forEach((address) =>
    multi.call(address, options.bancorStandardRewardsAddress, 'providerStake', [
      address,
      latestProgramId.toString()
    ])
  );
  const scores: Record<string, BigNumberish> = await multi.execute();

  // Get the Underlying Value of the Pool Token * 10**(decimals) to convert from wei
  const poolTokenDecimalScaling = (10 ** options.decimals).toString();
  const underlyingValue = await call(
    provider,
    bancorNetworkInfoABI,
    [
      options.bancorNetworkInfoAddress,
      'poolTokenToUnderlying',
      [options.underlyingTokenAddress, poolTokenDecimalScaling]
    ],
    { blockTag }
  ).then((res) => parseFloat(formatUnits(res, 2 * options.decimals)));

  // Update the providers' stakes in the standard rewards contract to their converted underlying value
  return Object.fromEntries(
    Object.entries(scores).map((res: any) => [res[0], res[1] * underlyingValue])
  );
}
