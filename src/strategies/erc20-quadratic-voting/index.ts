import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';

const ONE = BigNumber.from(1);
const TWO = BigNumber.from(2);

// Square root implementation for BigNumber
function sqrt(value: BigNumber): BigNumber {
  let z = value.add(ONE).div(TWO);
  let y = value;
  while (z.sub(y).isNegative()) {
    y = z;
    z = value.div(z).add(z).div(TWO);
  }
  return y;
}

export const author = 'snapshot-labs';
export const version = '1.0.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)'
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

  // Validate required options
  if (!options.address) {
    throw new Error('Token address is required');
  }
  if (!options.decimals) {
    throw new Error('Token decimals are required');
  }

  // Get token balances for all addresses
  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    multi.call(address, options.address, 'balanceOf', [address])
  );
  const result: Record<string, BigNumber> = await multi.execute();

  // Apply quadratic voting (square root of balance)
  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(sqrt(balance), options.decimals / 2))
    ])
  );
} 