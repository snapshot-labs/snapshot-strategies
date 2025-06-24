import { BigNumberish } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';
import { formatUnits } from '@ethersproject/units';

export const author = 'tutellus';
export const version = '0.1.0';
export const name = 'dappcomposer-getvotingunits';

const veTokenABI = [
  'function getVotingUnits(address account) public view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : undefined;

  // Initialize Multicaller
  const multi = new Multicaller(network, provider, veTokenABI, { blockTag });

  // Third batch: Get voting power for each token
  addresses.forEach((address) => {
    multi.call(`${address}`, options.address, 'getVotingUnits', [address]);
  });

  const voteByTokenIds: Record<string, BigNumberish> = await multi.execute();

  // Calculate final scores
  const scores = {};
  addresses.forEach((address) => {
    let totalVotingPower = 0;
    const power = voteByTokenIds[address];
    totalVotingPower += Number(formatUnits(power, options.decimals || 18));
    scores[address] = totalVotingPower;
  });

  return scores;
}
