import { getAddress } from '@ethersproject/address';
import { getProvider, multicall, subgraphRequest } from '../../utils';
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

async function getIDChainBlock(snapshot, provider, chainId) {
  const ts = (await provider.getBlock(snapshot)).timestamp;
  const query = {
    blocks: {
      __args: {
        where: {
          ts: ts,
          network_in: [chainId]
        }
      },
      number: true
    }
  };
  const url = 'https://blockfinder.snapshot.org';
  const data = await subgraphRequest(url, query);
  return data.blocks[0].number;
}

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

  const poolAddressesToAdd: string[] = [];

  if (options.pools) {
    for (const poolAddress of options.pools) {
      const exists = addresses.find(
        (address: string) => address.toLowerCase() === poolAddress.toLowerCase()
      );
      if (!exists) {
        poolAddressesToAdd.push(poolAddress);
      }
    }

    if (poolAddressesToAdd.length > 0) {
      addresses = addresses.concat(poolAddressesToAdd);
    }
  }

  const destinationChainProvider = getProvider(options.targetChainId);
  // Get corresponding block number on the destination chain side
  const destinationChainBlockTag = await getIDChainBlock(
    blockTag,
    provider,
    options.targetChainId
  );

  // Create block list
  const blockList = getPreviousBlocks(
    destinationChainBlockTag,
    options.sampleStep,
    options.sampleSize,
    options.blocksPerDay
  );

  const balanceOfQueries: any[] = [];
  for (const address of addresses) {
    balanceOfQueries.push([options.targetVsdcrv, 'balanceOf', [address]]);
  }

  // Max 4 calls on destination chain because we need one call for mainnet one
  const response: any[] = [];
  for (let i = 0; i < options.sampleStep; i++) {
    response.push(
      await multicall(
        options.targetChainId,
        destinationChainProvider,
        abi,
        balanceOfQueries,
        { blockTag: blockList[i] }
      )
    );
  }

  const mainChainResponses = await multicall(
    network,
    provider,
    abi,
    [
      [options.veAddress, 'balanceOf', [options.locker]],
      [options.sdTokenGauge, 'working_supply'],
      [options.sdTokenGauge, 'working_balances', [options.booster]],
      [options.vsdToken, 'totalSupply', []]
    ],
    { blockTag }
  );

  const lockerVeBalance = mainChainResponses.shift()[0]; // Last response, latest block
  const workingSupply = mainChainResponses.shift()[0]; // Last response, latest block
  const workingBalances = mainChainResponses.shift()[0]; // Last response, latest block
  const vsdCRVTotalSupply = parseFloat(
    formatUnits(BigNumber.from(mainChainResponses.shift()[0]), 18)
  ); // Last response, latest block

  const totalVP =
    (parseFloat(formatUnits(workingBalances, 18)) /
      parseFloat(formatUnits(workingSupply, 18))) *
    parseFloat(formatUnits(lockerVeBalance, 18));

  const votingPowers = Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {
        // Init array of working balances for user
        const userWorkingBalances: number[] = [];

        for (let j = 0; j < options.sampleStep; j++) {
          const balanceOf = parseFloat(
            formatUnits(BigNumber.from(response[j].shift()[0]), 18)
          );

          // Add working balance to array.
          if (vsdCRVTotalSupply === 0) {
            userWorkingBalances.push(0);
          } else {
            userWorkingBalances.push(balanceOf / vsdCRVTotalSupply);
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
        return [getAddress(addresses[i]), Number(votingPower)];
      })
  );

  // Assign 0 to pools and vp to bot address
  const userAddresses = Object.keys(votingPowers);

  if (options.pools) {
    const haveBotAddress = addresses.find(
      (user: string) => user.toLowerCase() === options.botAddress.toLowerCase()
    );
    if (haveBotAddress) {
      let botVotingPower = 0;
      for (const user of userAddresses) {
        const isPool = options.pools.find(
          (poolAddress: string) =>
            poolAddress.toLowerCase() === user.toLowerCase()
        );
        if (isPool) {
          botVotingPower += votingPowers[user];
          votingPowers[user] = 0;
        }
      }

      votingPowers[getAddress(options.botAddress)] = Number(botVotingPower);
    }
  }

  // Remove pool addresses added previously
  const vps = {};
  for (const user of userAddresses) {
    const isAdded = poolAddressesToAdd.find(
      (poolAddress: string) => poolAddress.toLowerCase() === user.toLowerCase()
    );
    if (!isAdded) {
      vps[user] = votingPowers[user];
    }
  }

  return vps;
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
  daysInterval: number,
  blocksPerDay: number
): number[] {
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
