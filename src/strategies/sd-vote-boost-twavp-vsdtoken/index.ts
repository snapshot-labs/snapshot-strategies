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
  'function working_balances(address account) external view returns (uint256)'
];

const MIN_BLOCK = 18835548;

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

  const balanceOfQueries: any[] = [];
  for (const address of addresses) {
    balanceOfQueries.push([options.vsdToken, 'balanceOf', [address]]);
    balanceOfQueries.push([options.vsdToken, 'totalSupply', []]);
  }

  const response: any[] = [];
  for (let i = 0; i < options.sampleStep; i++) {
    // Use good block number
    blockTag = blockList[i];

    const loopCalls: any[] = [];

    // Add mutlicall response to array
    if (i === options.sampleStep - 1) {
      // End
      loopCalls.push([options.veAddress, 'balanceOf', [options.locker]]);
      loopCalls.push([options.sdTokenGauge, 'working_supply']);
      loopCalls.push([
        options.sdTokenGauge,
        'working_balances',
        [options.booster]
      ]);
      loopCalls.push(...balanceOfQueries);
    } else {
      loopCalls.push(...balanceOfQueries);
    }

    response.push(
      await multicall(network, provider, abi, loopCalls, { blockTag })
    );
  }

  const lockerVeBalance = response[response.length - 1].shift()[0]; // Last response, latest block
  const workingSupply = response[response.length - 1].shift()[0]; // Last response, latest block
  const workingBalances = response[response.length - 1].shift()[0]; // Last response, latest block

  const totalVP =
    (parseFloat(formatUnits(workingBalances, 18)) /
      parseFloat(formatUnits(workingSupply, 18))) *
    parseFloat(formatUnits(lockerVeBalance, 18));

  return Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {
        // Init array of working balances for user
        const userWorkingBalances: number[] = [];

        for (let j = 0; j < options.sampleStep; j++) {
          const balanceOf = parseFloat(
            formatUnits(BigNumber.from(response[j].shift()[0]), 18)
          );
          const totalSupply = parseFloat(
            formatUnits(BigNumber.from(response[j].shift()[0]), 18)
          );

          // Add working balance to array.
          if (totalSupply === 0) {
            userWorkingBalances.push(0);
          } else {
            userWorkingBalances.push(balanceOf / totalSupply);
          }
        }

        // Get average working balance.
        const averageWorkingBalance = average(
          userWorkingBalances,
          addresses[i],
          options.whiteListedAddress
        );

        // Calculate voting power.
        const votingPower = totalVP != 0 ? averageWorkingBalance * totalVP : 0;

        // Return address and voting power
        return [addresses[i], Number(votingPower)];
      })
  );
}

function average(
  numbers: number[],
  address: string,
  whiteListedAddress: string[]
): number {
  // If no numbers, return 0 to avoid division by 0.
  if (numbers.length === 0) return 0;

  // If address is whitelisted, return most recent working balance. i.e. no twavp applied.
  if (whiteListedAddress.includes(address)) return numbers[numbers.length - 1];

  // Init sum
  let sum = 0;
  // Loop through all elements and add them to sum
  for (let i = 0; i < numbers.length; i++) {
    sum += numbers[i];
  }

  // Return sum divided by array length to get mean
  return sum / numbers.length;
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
    let blockNumber =
      currentBlockNumber - totalBlocksInterval + blockInterval * i;
    if (blockNumber < MIN_BLOCK) {
      blockNumber = MIN_BLOCK;
    }
    // Add block number to array
    blockNumbers.push(Math.round(blockNumber));
  }

  // Return array of block numbers
  return blockNumbers;
}
