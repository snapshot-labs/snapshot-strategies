import { multicall } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';

export const author = 'pierremarsotlyon1';
export const version = '0.0.1';

// Used ABI
const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function working_supply() external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function working_balances(address account) external view returns (uint256)',
  'function balances(uint256 i) external view returns (uint256)'
];

const MIN_BOOST = 0.4;

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  // Maximum of 5 multicall!
  if (options.sampleStep > 5) {
    throw new Error('maximum of 5 call');
  }

  // Maximum of 20 whitelisted address
  if (options.whiteListedAddress.length > 20) {
    throw new Error('maximum of 20 whitelisted address');
  }

  // Maximum of 500 pools address
  if (options.pools.length > 500) {
    throw new Error('maximum of 500 pools');
  }

  const calls: any[] = [];
  calls.push([options.sdToken, 'totalSupply', []]);

  for (const pool of options.pools) {
    calls.push([pool, 'balances', [1]]);
  }
  calls.push([options.veToken, 'balanceOf', [options.liquidLocker]]);

  // --- Create block number list for twavp
  // Obtain last block number
  // Create block tag
  let blockTag = 0;
  if (typeof snapshot === 'number') {
    blockTag = snapshot;
  } else {
    blockTag = await provider.getBlockNumber();
  }

  // Create block list
  const blockList = getPreviousBlocks(
    blockTag,
    options.sampleStep,
    options.sampleSize
  );

  // Query working balance of users
  const workingBalanceQuery = addresses.map((address: any) => [
    options.sdTokenGauge,
    'working_balances',
    [address]
  ]);

  // Execute multicall `sampleStep` times
  const response: any[] = [];
  for (let i = 0; i < options.sampleStep; i++) {
    // Use good block number
    blockTag = blockList[i];

    const loopCalls: any[] = [];

    // Add mutlicall response to array
    if (i === options.sampleStep - 1) {
      // End
      loopCalls.push([options.sdTokenGauge, 'working_supply']);
      loopCalls.push(...workingBalanceQuery);
      loopCalls.push(...calls);
    } else {
      loopCalls.push(...workingBalanceQuery);
    }

    response.push(
      await multicall(network, provider, abi, loopCalls, { blockTag })
    );
  }

  const workingSupply = parseFloat(
    formatUnits(response[response.length - 1].shift()[0], 18)
  );
  const lockerVotingPower = parseFloat(
    formatUnits(response[response.length - 1].pop()[0], 18)
  );

  const poolsBalances = options.pools.map(
    () => response[response.length - 1].pop()[0]
  );
  const sumPoolsBalance = parseFloat(
    formatUnits(
      poolsBalances.reduce(
        (acc, balance) => acc.add(balance),
        BigNumber.from(0)
      ),
      18
    )
  );

  const sdTknSupply = parseFloat(
    formatUnits(response[response.length - 1].pop()[0], 18)
  );

  const liquidityVoteFee =
    (MIN_BOOST * sumPoolsBalance * lockerVotingPower) / sdTknSupply;

  const totalUserVotes = lockerVotingPower - liquidityVoteFee;

  return Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {
        // Init array of working balances for user
        const userWorkingBalances: BigNumber[] = [];

        for (let j = 0; j < options.sampleStep; j++) {
          // Add working balance to array.
          userWorkingBalances.push(response[j].shift()[0]);
        }

        if (addresses[i].toLowerCase() === options.botAddress.toLowerCase()) {
          return [addresses[i], Number(liquidityVoteFee)];
        } else {
          // Get average working balance.
          const averageWorkingBalance = parseFloat(
            formatUnits(
              average(
                userWorkingBalances,
                addresses[i],
                options.whiteListedAddress
              ),
              18
            )
          );

          // Calculate voting power.
          const userVote =
            workingSupply != 0
              ? (averageWorkingBalance / workingSupply) * totalUserVotes
              : 0;

          // Return address and voting power
          return [addresses[i], Number(userVote)];
        }
      })
  );
}

function getPreviousBlocks(
  currentBlockNumber: number,
  numberOfBlocks: number,
  daysInterval: number
): number[] {
  // Estimate number of blocks per day
  const blocksPerDay = 86400 / 12;
  // Calculate total blocks interval
  const totalBlocksInterval = blocksPerDay * daysInterval;
  // Calculate block interval
  const blockInterval = totalBlocksInterval / (numberOfBlocks - 1);

  // Init array of block numbers
  const blockNumbers: number[] = [];

  for (let i = 0; i < numberOfBlocks; i++) {
    // Calculate block number
    const blockNumber =
      currentBlockNumber - totalBlocksInterval + blockInterval * i;
    // Add block number to array
    blockNumbers.push(Math.round(blockNumber));
  }

  // Return array of block numbers
  return blockNumbers;
}

function average(
  numbers: BigNumber[],
  address: string,
  whiteListedAddress: string[]
): BigNumber {
  // If no numbers, return 0 to avoid division by 0.
  if (numbers.length === 0) return BigNumber.from(0);

  // If address is whitelisted, return most recent working balance. i.e. no twavp applied.
  if (whiteListedAddress.includes(address)) return numbers[numbers.length - 1];

  // Init sum
  let sum = BigNumber.from(0);
  // Loop through all elements and add them to sum
  for (let i = 0; i < numbers.length; i++) {
    sum = sum.add(numbers[i]);
  }

  // Return sum divided by array length to get mean
  return sum.div(numbers.length);
}
