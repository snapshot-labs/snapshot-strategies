import fetch from 'cross-fetch';
import { formatUnits, parseUnits } from '@ethersproject/units';

import { Multicaller } from '../../utils';

export const author = 'dasanra';
export const version = '0.1.0';

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
  const multi = new Multicaller(network, provider, abi, { blockTag });

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

  // Check vesting state, consider only unclaimed amounts and group allocations to the same account
  return Object.keys(vestings).reduce((acc, key) => {
    const { account, amount } = allocationsList
      .flat()
      .find(({ vestingId }) => vestingId === key) as AllocationDetails;

    const hasAlreadyClaimed = vestings[key].account === account;
    // If account already claimed only count the pending amount
    // Else nothing claimed yet so consider the full allocation
    const currentVestingAmount = hasAlreadyClaimed
      ? vestings[key].amount.sub(vestings[key].amountClaimed)
      : amount;

    const previousAmount = acc[account];
    // If account received multiple allocations sum them
    // Else we just return the currentAmount
    const pendingVestedAmount = previousAmount
      ? parseUnits(previousAmount).add(currentVestingAmount)
      : currentVestingAmount;

    return {
      ...acc,
      [account]: formatUnits(pendingVestedAmount)
    };
  }, {});
}
