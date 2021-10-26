import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import { abi } from './VeXBE.json';

export const author = 'xbe.finance';
export const version = '0.0.1';

const veXBE = "0x5564585073D4Ca3866931b0660Df29921C4BBbcc";

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {

  const latestBlockTime = (await provider.getBlock()).timestamp;
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    multi.call(address, veXBE, 'balanceOf(address,uint256)', [address, latestBlockTime])
  );
  const result: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
