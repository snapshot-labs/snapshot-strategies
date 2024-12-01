import { BigNumberish } from '@ethersproject/bignumber';
import { getAddress } from '@ethersproject/address';
import { Multicaller } from '../../utils';

export const author = 'SheeranJL';
export const version = '0.1.2';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function delegates(address account) external view returns (address)'
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
  const results: Record<string, number> = {};

  try {

    const multi = new Multicaller(network, provider, abi, { blockTag });

    // Fetch NFT balances
    addresses.forEach((address) =>
      multi.call(address, options.address, 'balanceOf', [address])
    );
    const balances: Record<string, BigNumberish> = await multi.execute();

    addresses.forEach((address) =>
      multi.call(address, options.address, 'delegates', [address])
    );
    const delegationMap: Record<string, string> = await multi.execute();

    const uniqueVoters: Set<string> = new Set();

    Object.entries(balances).forEach(([address, balance]) => {
      if (parseFloat(balance.toString()) > 0) {
        uniqueVoters.add(getAddress(address));
      }
    });

    Object.entries(delegationMap).forEach(([delegator, delegate]) => {
      if (delegate && delegate !== '0x0000000000000000000000000000000000000000') {
        uniqueVoters.add(getAddress(delegate));
      }
    });
    
    uniqueVoters.forEach((voter) => {
      results[voter] = 1;
    });

  } catch (error) {
    console.error(`Strategy execution failed:`, error);
  }

  return results;
}

