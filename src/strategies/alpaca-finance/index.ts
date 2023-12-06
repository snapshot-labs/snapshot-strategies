import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

const abi = ['function userLockAmounts(address) view returns (uint256)'];

export const author = 'spicysquid168';
export const version = '0.0.1';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const contract = '0x5E0F05D997d3904dE16d49c0125385e6FAd8FeEe';

  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    multi.call(address, contract, 'userLockAmounts', [address])
  );
  const result: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => {
      return [
        address,
        parseFloat(formatUnits(balance, 18))
      ]
    })
  );
}
