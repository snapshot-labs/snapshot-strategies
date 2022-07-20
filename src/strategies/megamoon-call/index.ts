import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'bonustrack';
export const version = '0.0.1';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const abi = [
    options.abis
  ];
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    multi.call(address, options.address, options.callname, [address])
  );
  if (options.arr >= 0) {
    const result: Record<string, BigNumberish[]> = await multi.execute();
    return Object.fromEntries(
      Object.entries(result).map(([address, balance]) => [
        address,
        parseFloat(formatUnits(balance[0], options.decimals))
      ])
    );
  } else {
    const result: Record<string, BigNumberish> = await multi.execute();
    return Object.fromEntries(
      Object.entries(result).map(([address, balance]) => [
        address,
        parseFloat(formatUnits(balance, options.decimals))
      ])
    );
  }
  
}
