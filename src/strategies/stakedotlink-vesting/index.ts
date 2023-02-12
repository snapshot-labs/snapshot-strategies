import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'stakedotlink';
export const version = '0.0.1';

const abi = [
  'function balanceOf(address _account) public view returns (uint256)',
  'function totalBalanceOf(address _account) public view returns (uint256)'
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
  const balanceResult: Record<string, BigNumberish> = await multi.execute();
  addresses.forEach((address) =>
    multi.call(address, options.address, 'totalBalanceOf', [address])
  );
  const totalBalanceResult: Record<string, BigNumberish> =
    await multi.execute();

  return Object.fromEntries(
    Object.entries(balanceResult).map(([address, balance]) => {
      const vestingBalance =
        parseFloat(formatUnits(totalBalanceResult[address], options.decimals)) -
        parseFloat(formatUnits(balance, options.decimals));
      return [address, vestingBalance];
    })
  );
}
