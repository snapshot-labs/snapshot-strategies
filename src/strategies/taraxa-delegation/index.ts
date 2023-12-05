import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import networks from '@snapshot-labs/snapshot.js/src/networks.json';
import { Multicaller } from '../../utils';

export const author = 'Taraxa-project';
export const version = '0.1.0';

const abi = [
  'function getTotalDelegation(address delegator) external view returns (uint256 total_delegation)',
  'function getEthBalance(address account) public view returns (uint256 balance)'
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
  addresses.forEach((address: string) => {
    multi.call(address, options.address, 'getTotalDelegation', [address]);
  });
  const resultDelegations: Record<string, BigNumberish> = await multi.execute();

  addresses.forEach((address: string) => {
    multi.call(address, networks[network].multicall, 'getEthBalance', [
      address
    ]);
  });
  const resultBalances: Record<string, BigNumberish> = await multi.execute();

  const scores = {};

  for (const address of addresses) {
    const score = BigNumber.from(resultBalances[address] || 0).add(
      BigNumber.from(resultDelegations[address] || 0)
    );

    scores[getAddress(address)] = parseFloat(
      formatUnits(score, options.decimals)
    );
  }

  return scores;
}
