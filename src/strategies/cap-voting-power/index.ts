import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Contract } from '@ethersproject/contracts';

export const author = 'unRealGamer28';
export const version = '0.1.0';

const abi = ['function totalSupply(uint256 t) external view returns (uint256)'];

const maxLockupDuration = 4 * 365 * 24 * 60 * 60; // Maximum lockup duration is 4 years in seconds based on Curve VE contract
const maxVestingDuration = 4 * 365 * 24 * 60 * 60; // Maximum vesting duration is 4 years in seconds
const maxVestingAddressCount = 500; // Maximum number of vesting addresses

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  // Assertions/checks to validate options
  if (!options.vestingAddresses || options.vestingAddresses.length === 0) {
    throw new Error(
      'Invalid options provided! Please make sure vestingAddresses is provided.'
    );
  }
  if (options.vestingAddresses.length > maxVestingAddressCount) {
    throw new Error(
      `Too many vesting addresses provided! The maximum allowed is ${maxVestingAddressCount}.`
    );
  }
  options.vestingAddresses.forEach((vestingAddress) => {
    if (
      !('address' in vestingAddress) ||
      !('lockedTokens' in vestingAddress) ||
      !('cliffMonths' in vestingAddress) ||
      !('vestingMonths' in vestingAddress) ||
      !('startDateTimestamp' in vestingAddress) ||
      !('initialReleasePercentage' in vestingAddress)
    ) {
      throw new Error(
        'Invalid options provided! Please make sure each vesting address object has all required properties.'
      );
    }
  });
  if (options.clampPercentage < 0 || options.clampPercentage > 1) {
    throw new Error(
      'Invalid clamp percentage! Please provide a number between 0 and 1.'
    );
  }
  if (!options.votingEscrowContractAddress || !options.decimals) {
    throw new Error(
      'Invalid options provided! Please make sure votingEscrowContractAddress and decimals are provided.'
    );
  }

  // Find current timestamp
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  let block;
  try {
    block = await provider.getBlock(blockTag);
  } catch (error) {
    throw new Error('Failed to get block information');
  }
  const now = block.timestamp;

  // Calculate voting power for each vesting address and create vestingAddressesArray
  const vestingVotingPower = {};
  const vestingAddressesArray: string[] = [];
  options.vestingAddresses.forEach((vestingAddress) => {
    const {
      address,
      lockedTokens,
      cliffMonths,
      vestingMonths,
      startDateTimestamp,
      initialReleasePercentage
    } = vestingAddress;

    // Calculate the cliffEndDateTimestamp by adding the cliff duration (in seconds) to the startDateTimestamp.
    const cliffEndDateTimestamp =
      startDateTimestamp + ((cliffMonths * 365) / 12) * (24 * 60 * 60);
    // Calculate the endDateTimestamp by adding the total vesting duration (in seconds) to the startDateTimestamp.
    const endDateTimestamp =
      startDateTimestamp +
      (((cliffMonths + vestingMonths) * 365) / 12) * (24 * 60 * 60);
    const votingPower = votingPowerCalc(
      lockedTokens,
      now,
      startDateTimestamp,
      cliffEndDateTimestamp,
      endDateTimestamp,
      initialReleasePercentage
    );

    // Add the final voting power of any duplicate addresses
    vestingVotingPower[address] =
      vestingVotingPower[address] === undefined
        ? votingPower
        : vestingVotingPower[address] + votingPower;

    vestingAddressesArray.push(address);
  });

  // Calculate total voting power for vesting addresses
  let vestingTotalVotingPower = 0;
  Object.values(vestingVotingPower).forEach((value) => {
    if (typeof value === 'number') vestingTotalVotingPower += value;
  });

  // Get voting escrow's total voting power
  const votingEscrowContract = new Contract(
    options.votingEscrowContractAddress,
    abi,
    provider
  );
  const votingEscrowTotalVotingPower: BigNumber =
    await votingEscrowContract.totalSupply(now);
  const escrowTotalVotingPower = parseFloat(
    formatUnits(votingEscrowTotalVotingPower, options.decimals)
  );

  // Clamp the vesting voting power for each address if the total vesting voting power is greater than the clamped total vesting voting power based on the clamp percentage
  const vestingClampedTotalVotingPower = calculateClampedVotingPower(
    escrowTotalVotingPower,
    options.clampPercentage
  );
  if (vestingTotalVotingPower > vestingClampedTotalVotingPower) {
    const clampRatio = vestingClampedTotalVotingPower / vestingTotalVotingPower;

    // Calculate the new clamped voting power for each vesting address
    Object.keys(vestingVotingPower).forEach((address) => {
      vestingVotingPower[address] = vestingVotingPower[address] * clampRatio;
    });
  }

  // Return the final voting power for addresses that are in the vestingAddressesArray
  const result = {};
  addresses.forEach((address: string) => {
    if (vestingAddressesArray.includes(address)) {
      result[address] = vestingVotingPower[address];
    }
  });
  return result;
}

/**
 * Calculate the voting power based on the given parameters.
 *
 * @function
 * @param {number} lockedToken - The number of tokens locked in the vesting contract.
 * @param {number} currentDateTS - The current date timestamp (in seconds).
 * @param {number} startDateTS - The start date timestamp of the vesting period (in seconds).
 * @param {number} cliffEndDateTS - The end date timestamp of the cliff period (in seconds).
 * @param {number} endDateTS - The end date timestamp of the vesting period (in seconds).
 * @param {number} initialReleasePercentage - The initial percentage of tokens released at the end of the cliff.
 * @returns {number} The calculated voting power based on the input parameters.
 */
function votingPowerCalc(
  lockedToken,
  currentDateTS,
  startDateTS,
  cliffEndDateTS,
  endDateTS,
  initialReleasePercentage
): number {
  // Store function parameters as constants
  const lockedTokenAmount = lockedToken;
  let currentTimestamp = currentDateTS;
  const startTimestamp = startDateTS;
  const cliffEndTimestamp = cliffEndDateTS;
  const endTimestamp = endDateTS;

  // Calculate initial release amount based on initial release percentage
  const initialReleaseAmount = lockedTokenAmount * initialReleasePercentage;
  // Calculate adjusted locked token amount
  const adjustedLockedTokenAmount = lockedTokenAmount - initialReleaseAmount;

  // Assertions/checks to limit function parameters
  if (startTimestamp > currentTimestamp) currentTimestamp = startTimestamp;
  if (endTimestamp < currentTimestamp) return 0; // If endTimestamp is in the past, return 0 voting power
  if (startTimestamp > endTimestamp)
    throw new Error('Vesting start date cannot begin after the end date.');
  if (startTimestamp > cliffEndTimestamp)
    throw new Error(
      'Vesting start date cannot begin after the cliff end date.'
    );
  if (endTimestamp < cliffEndTimestamp)
    throw new Error('Vesting end date cannot end before the cliff end date.');
  if (lockedTokenAmount <= 0)
    throw new Error('Token amount must be greater than 0.');

  // Calculate cliffDuration and vestingDuration, and asset it matches to totalDuration
  const totalDuration = endTimestamp - startTimestamp;
  const cliffDuration = cliffEndTimestamp - startTimestamp;
  const vestingDuration = endTimestamp - cliffEndTimestamp;
  if (cliffDuration + vestingDuration != totalDuration)
    throw new Error(
      "Cliff duration and vesting duration don't match up to total duration."
    );

  // Calculate remaining cliff duration and vesting duration
  let remainingCliffDuration;
  if (currentTimestamp >= cliffEndTimestamp) remainingCliffDuration = 0;
  else remainingCliffDuration = cliffEndTimestamp - currentTimestamp;

  let remainingVestingDuration;
  if (currentTimestamp >= cliffEndTimestamp)
    remainingVestingDuration = endTimestamp - currentTimestamp;
  else remainingVestingDuration = vestingDuration;

  // Clamp remaining cliff duration and vesting duration to maxLockupDuration and maxVestingDuration respectively
  const clampedRemainingCliffDuration = Math.min(
    remainingCliffDuration,
    maxLockupDuration
  );
  const clampedRemainingVestingDuration = Math.min(
    remainingVestingDuration,
    maxVestingDuration
  );

  // Calculate decayed voting power for the cliffDuration (25% portion)
  const decayCliffVPInitialRelease =
    (initialReleaseAmount / maxLockupDuration) * clampedRemainingCliffDuration;

  // Calculate decayed voting power for the cliffDuration (75% portion)
  const decayCliffVPAdjustedLockedToken =
    (adjustedLockedTokenAmount / maxLockupDuration) *
    clampedRemainingCliffDuration;

  // Calculate the average decayed voting power for the vestingDuration (75% portion)
  const tokensVestedPerSecond = adjustedLockedTokenAmount / vestingDuration;
  const remainingTokenAmount = remainingVestingDuration * tokensVestedPerSecond;

  const decayVestingVPAdjustedLockedToken =
    (remainingTokenAmount / maxVestingDuration) *
    clampedRemainingVestingDuration *
    0.5; // Average the decayed voting power

  // Combine all decayed voting power
  const currentVotingPower =
    decayCliffVPInitialRelease +
    decayCliffVPAdjustedLockedToken +
    decayVestingVPAdjustedLockedToken;

  // Cap currentVotingPower to maximumVotingPower (lockedTokenAmount)
  if (currentVotingPower >= lockedTokenAmount) {
    return lockedTokenAmount;
  }

  // Finally, return the currentVotingPower
  return currentVotingPower;
}

/**
 * Calculate the clamped voting power of the vesting contract.
 *
 * @param {number} escrowVotingPower - The total voting power of the escrow contract.
 * @param {number} vestingClampPercentage - The desired percentage of total voting power for the vesting contract.
 * @return {number} The clamped voting power for the vesting contract.
 */
function calculateClampedVotingPower(
  escrowVotingPower,
  vestingClampPercentage
) {
  // Calculate the percentage of voting power allocated to the escrow contract,
  // which is the remaining percentage after allocating the vestingClampPercentage to the vesting contract
  const escrowClampPercentage = 1 - vestingClampPercentage;

  // Calculate the combined total voting power of the escrow and vesting contracts,
  // considering the escrowVotingPower and the escrowClampPercentage
  const totalVotingPower = escrowVotingPower / escrowClampPercentage;

  // Return the clamped voting power for the vesting contract,
  // which is the product of the total voting power and the vestingClampPercentage
  return totalVotingPower * vestingClampPercentage;
}
