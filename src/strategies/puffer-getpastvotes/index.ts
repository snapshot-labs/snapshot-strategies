import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'bxmmm1';
export const version = '0.1.0';

const abi = [
  'function getPastVotes(address account, uint256 timepoint) view returns (uint256)'
];

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // Create a multicaller for the block tag, either past / present
  const multi = new Multicaller(network, provider, abi, { blockTag });

  // Figure out the current block number
  let blockNumber = blockTag;

  // If the block tag is not the latest block, use the block tag as blockNumber
  if (blockTag === 'latest') {
    blockNumber = await provider.getBlockNumber();
  }

  // Fetch that block to figure out the block timestamp (current interval block timestamp)
  const block = await provider.getBlock(blockNumber);

  // We want to use `getPastVotes` because of the delegation happening on the contract
  // We want to use the past timestamp to get the votes at the start of the previous week

  // Calculate the timestamp at the end of the most recent complete 7-day period
  // This ensures alignment with contract's 7-day voting periods
  const SECONDS_PER_WEEK = 7 * 24 * 60 * 60;
  // Get the current timestamp in seconds
  const currentIntervalBlockTimestampInSeconds = block.timestamp;

  // Calculate the current period based on the current timestamp
  const currentPeriod = Math.floor(
    currentIntervalBlockTimestampInSeconds / SECONDS_PER_WEEK
  );
  // Calculate the timestamp at the end of the previous period
  const previousPeriodEnd = currentPeriod * SECONDS_PER_WEEK - 1;

  addresses.forEach((address) =>
    multi.call(address, options.address, 'getPastVotes', [
      address,
      previousPeriodEnd.toString()
    ])
  );

  const result: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
