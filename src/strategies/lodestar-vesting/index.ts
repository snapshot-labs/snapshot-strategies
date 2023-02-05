import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = '0xAppo';
export const version = '0.1.0';

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

  if (
    options.beneficiaryAddresses.length >= 25 ||
    options.contractAddresses.length >= 25
  ) {
    throw new Error('Too many beneficiary/contract addresses provided.');
  }
  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) => {
    if (options.beneficiaryAddresses.includes(address)) {
      const index = options.beneficiaryAddresses.indexOf(address);
      const contractAddress = options.contractAddresses[index];
      multi.call(address, options.address, 'balanceOf', [contractAddress]);
    }
  });

  const result: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      getAddress(address),
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
