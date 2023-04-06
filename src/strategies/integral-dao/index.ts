import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'ken';
export const version = '0.1.0';

const abi = [
  'function getPriorVotes(address account, uint256 blockNumber) external view returns (uint96)',
  'function getCurrentVotes(address account) external view returns (uint96)'
];

async function getVotes(
  multi: any,
  addresses: string[],
  contractAddress: string,
  decimals: number,
  blockTag: string | number
) {
  if (blockTag === 'latest') {
    addresses.forEach((address) => {
      multi.call(address, contractAddress, 'getCurrentVotes', [address]);
    });
  } else {
    addresses.forEach((address) => {
      multi.call(address, contractAddress, 'getPriorVotes', [
        address,
        blockTag
      ]);
    });
  }
  const result: Record<string, BigNumberish> = await multi.execute();
  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, decimals))
    ])
  );
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const results = await Promise.all(
    options.contractAddresses.map((contractAddress) =>
      getVotes(
        new Multicaller(network, provider, abi, { blockTag }),
        addresses,
        contractAddress,
        options.decimals,
        blockTag
      )
    )
  );

  return results.slice(1).reduce((acc, result) => {
    Object.keys(result).forEach((address) => {
      if (acc[address]) {
        acc[address] += result[address];
      }
    });
    return acc;
  }, results[0]);
}
