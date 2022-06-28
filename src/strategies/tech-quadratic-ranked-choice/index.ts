import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

const ONE = BigNumber.from(1);
const TWO = BigNumber.from(2);

// For further explanation take a look on @ricmoo explanation here https://github.com/ethers-io/ethers.js/issues/1182
function sqrt(value: BigNumber) {
  let z = value.add(ONE).div(TWO);
  let y = value;
  while (z.sub(y).isNegative()) {
    y = z;
    z = value.div(z).add(z).div(TWO);
  }
  return BigNumber.from(y);
}

export const author = 'pkretzschmar';
export const version = '0.0.1';

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

  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    multi.call(address, options.address, 'balanceOf', [address])
  );
  const result: Record<string, BigNumber> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(sqrt(balance), options.decimals / 2))
    ])
  );
}
