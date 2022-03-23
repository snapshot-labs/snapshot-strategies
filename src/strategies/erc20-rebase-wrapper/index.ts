import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = '0xfoobar';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function exchangeRate() external view returns (uint256)',
  'function exchangeRatePrecision() external view returns (uint256)'
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
  multi.call('exchangeRate', options.wrapperAddress, 'exchangeRate');
  multi.call(
    'exchangeRatePrecision',
    options.wrapperAddress,
    'exchangeRatePrecision'
  );
  const { exchangeRate, exchangeRatePrecision } = await multi.execute();
  const rate = parseFloat(exchangeRate) / parseFloat(exchangeRatePrecision);

  addresses.forEach((address) =>
    multi.call(address, options.wrapperAddress, 'balanceOf', [address])
  );
  const result: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals)) * rate
    ])
  );
}
