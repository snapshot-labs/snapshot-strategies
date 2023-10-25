import { multicall } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'clement-ux';
export const version = '0.0.1';

// Used ABI
const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function working_supply() external view returns (uint256)',
  'function working_balances(address account) external view returns (uint256)'
];

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

  // --- Create block number list for twavp
  // Obtain last block number
  const lastBlock = await provider.getBlockNumber();
  // Create block tag
  let blockTag = typeof snapshot === 'number' ? snapshot : lastBlock;
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
  const response: number[] = [];
  for (let i = 0; i < options.sampleStep; i++) {
    // Use good block number
    blockTag = blockList[i];

    // Add mutlicall response to array
    response.push(
      await multicall(
        network,
        provider,
        abi,
        [
          [options.sdTokenGauge, 'working_supply'],
          [options.veToken, 'balanceOf', [options.liquidLocker]],
          ...workingBalanceQuery
        ],
        { blockTag }
      )
    );
  }

  // Get working supply
  const workingSupply = response[response.length - 1][0][0]; // Last response, latest block
  // Get voting power of liquid locker
  const votingPowerLiquidLocker = response[response.length - 1][1][0]; // Last response, latest block

  return Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {
        // Init array of working balances for user
        const userWorkingBalances: BigNumber[] = [];

        for (let j = 0; j < options.sampleStep; j++) {
          // Add working balance to array.
          userWorkingBalances.push(response[j][i + 2][0]);
        }

        // Get average working balance.
        const averageWorkingBalance = average(
          userWorkingBalances,
          addresses[i],
          options.whiteListedAddress
        );

        // Calculate voting power.
        const votingPower =
          workingSupply != 0
            ? averageWorkingBalance
                .mul(votingPowerLiquidLocker)
                .div(
                  workingSupply.mul(BigNumber.from(10).pow(options.decimals))
                )
            : 0;

        // Return address and voting power
        return [addresses[i], Number(votingPower)];
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
