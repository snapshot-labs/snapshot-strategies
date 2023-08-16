import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import { Multicaller } from '../../utils';

export const author = 'Taraxa-project';
export const version = '0.1.0';

const abi = [
  'function getTotalDelegation(address delegator) external view returns (uint256 total_delegation)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address: string) =>
    multi.call(address, options.address, 'getTotalDelegation', [address])
  );
  const result: Record<string, BigNumberish> = await multi.execute();
  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      getAddress(address),
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
