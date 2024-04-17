import fetch from 'cross-fetch';
import { formatUnits, parseUnits } from '@ethersproject/units';

import { Multicaller } from '../../utils';

export const author = 'dasanra';
export const version = '0.2.0';

// https://github.com/safe-global/safe-token/blob/81e0f3548033ca9916f38444f2e62e5f3bb2d3e1/contracts/VestingPool.sol
const abi = [
  'function vestings(bytes32) view returns (address account, uint8 curveType, bool managed, uint16 durationWeeks, uint64 startDate, uint128 amount, uint128 amountClaimed, uint64 pausingDate, bool cancelled)'
];

type AllocationDetails = {
  account: string;
  contract: string;
  vestingId: string;
  amount: string;
};

type Options = {
  allocationsSource: string;
  claimDateLimit: string | undefined;
};

const canStillClaim = (claimDateLimit: string | undefined): boolean => {
  // if a claim date limit is set we check if it's still possible to claim
  if (claimDateLimit) {
    const now = new Date();
    const limitDate = new Date(claimDateLimit);
    return now.getTime() < limitDate.getTime();
  }

  // if not date limit is set can always claim.
  return true;
};

export async function strategy(
  space: string,
  network: string,
  provider,
  addresses: string[],
  options: Options,
  snapshot: number | string = 'latest'
) {
  const response = await fetch(options.allocationsSource, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });
  const allocationsList: [[AllocationDetails]] = await response.json();

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const multi = new Multicaller(network, provider, abi, {
    blockTag,
    limit: 250
  });

  // Get current vesting state from smart contract using the vestingId
  addresses.forEach((address) => {
    const addressAllocations = allocationsList.find(
      (allocations: AllocationDetails[]) => allocations[0].account === address
    );

    if (addressAllocations) {
      addressAllocations.forEach(({ contract, vestingId }) => {
        multi.call(vestingId, contract, 'vestings', [vestingId]);
      });
    }
  });

  const vestings = await multi.execute();

  const flatAllocationsList = allocationsList.flat();
  // Check vesting state, consider only unclaimed amounts and group allocations to the same account
  return Object.keys(vestings).reduce((acc, key) => {
    const { account, amount } = flatAllocationsList.find(
      ({ vestingId }) => vestingId === key
    ) as AllocationDetails;

    const hasAlreadyClaimed = vestings[key].account === account;
    let currentVestingAmount;
    if (hasAlreadyClaimed) {
      // If account already claimed only count the pending amount
      currentVestingAmount = vestings[key].amount.sub(
        vestings[key].amountClaimed
      );
    } else {
      // Else nothing claimed yet so consider the full allocation
      // or none if the claim date limit was set and reached.
      currentVestingAmount = canStillClaim(options.claimDateLimit)
        ? amount
        : '0';
    }

    const previousAmount = acc[account];
    // If account received multiple allocations sum them
    // Else we just return the currentAmount
    const pendingVestedAmount = previousAmount
      ? parseUnits(previousAmount.toString()).add(currentVestingAmount)
      : currentVestingAmount;

    return {
      ...acc,
      [account]: parseFloat(formatUnits(pendingVestedAmount))
    };
  }, {});
}
