import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'MantisClone';
export const version = '0.1.0';

const abi = [
  'function underlying() public view returns (address)',
  'function decimals() public view returns (uint8)',
  'function exchangeRateStored() public view returns (uint256)',
  'function balanceOf(address owner) external returns (uint256)'
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
  multi.call('underlying', options.fToken, 'underlying', []);
  multi.call('tokenDecimals', options.token, 'decimals', []);
  multi.call('fTokenDecimals', options.fToken, 'decimals', []);
  multi.call('exchangeRate', options.fToken, 'exchangeRateStored', []);
  addresses.forEach((address) =>
    multi.call(`fTokenBalances.${address}`, options.fToken, 'balanceOf', [
      address
    ])
  );
  const result = await multi.execute();

  const underlying: string = result.underlying;
  const tokenDecimals: BigNumber = result.tokenDecimals;
  const fTokenDecimals: BigNumber = result.fTokenDecimals;
  const exchangeRate: BigNumber = result.exchangeRate;
  const fTokenBalances: Record<string, BigNumber> = result.fTokenBalances;

  if (options.token !== underlying) {
    throw new Error(
      `token parameter doesn't match fToken.underlying(). token=${options.token}, underlying=${underlying}`
    );
  }

  const mantissa: BigNumber = BigNumber.from(18)
    .add(tokenDecimals)
    .sub(fTokenDecimals);
  const divisor: BigNumber = BigNumber.from(10).pow(mantissa);

  return Object.fromEntries(
    Object.entries(fTokenBalances).map(([address, balance]) => [
      address,
      parseFloat(
        formatUnits(balance.mul(exchangeRate).div(divisor), fTokenDecimals)
      )
    ])
  );
}
