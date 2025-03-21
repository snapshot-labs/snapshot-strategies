import { multicall } from '../../utils';

export const author = 'clement-ux';
export const version = '0.0.1';
export const dependOnOtherAddress = false;
const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function working_supply() external view returns (uint256)',
  'function working_balances(address account) external view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  // BlockTag
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // Query
  const workingBalanceQuery = addresses.map((address: any) => [
    options.sdTokenGauge,
    'working_balances',
    [address]
  ]);

  // Multicall
  const response = await multicall(
    network,
    provider,
    abi,
    [
      [options.sdTokenGauge, 'working_supply'],
      [options.veToken, 'balanceOf', [options.liquidLocker]],
      ...workingBalanceQuery
    ],
    {
      blockTag
    }
  );

  // Constant
  const workingSupply = response[0]; // working supply on gauge
  const votingPowerLiquidLocker = response[1]; // balanceOf veCRV LiquidLocker

  // Return
  return Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {
        const votingPower =
          workingSupply > 0
            ? (response[i + 2] * votingPowerLiquidLocker) /
              (workingSupply * 10 ** options.decimals)
            : 0;
        return [addresses[i], votingPower];
      })
  );
}
