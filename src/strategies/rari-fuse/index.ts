import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
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
  multi.call('exchangeRate', options.fTokenAddress, 'exchangeRateStored', []);
  addresses.forEach((address) =>
    multi.call(`fTokenBalances.${address}`, options.fTokenAddress, 'balanceOf', [address])
  );
  const result = await multi.execute();

  const underlying: string = result.underlying;
  const tokenDecimals: BigNumber = result.tokenDecimals;
  const fTokenDecimals: BigNumber = result.fTokenDecimals;
  const exchangeRate: BigNumber = result.exchangeRate;
  const fTokenBalances: Record<string, BigNumberish> = result.fTokenBalances;

  console.log(`underlying = ${underlying}`);
  console.log(`tokenDecimals = ${tokenDecimals}`);
  console.log(`fTokenDecimals = ${fTokenDecimals}`);
  console.log(`exchangeRate = ${exchangeRate}`);
  console.log(`fTokenBalances = ${fTokenBalances}`);

  return Object.fromEntries(
    Object.entries(fTokenBalances).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, fTokenDecimals))
    ])
  );
}
