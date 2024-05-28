import fetch from 'cross-fetch';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { isAddress } from '@ethersproject/address';
import { isHexString } from '@ethersproject/bytes';

import { Multicaller } from '../../utils';

export const author = 'dasanra';
export const version = '0.2.0';

// https://github.com/safe-global/safe-token/blob/81e0f3548033ca9916f38444f2e62e5f3bb2d3e1/contracts/VestingPool.sol
const abi = [
  'function vestings(bytes32) view returns (address account, uint8 curveType, bool managed, uint16 durationWeeks, uint64 startDate, uint128 amount, uint128 amountClaimed, uint64 pausingDate, bool cancelled)'
];

type Allocation = {
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

let _allocationMap: Record<string, Allocation[]> | null = null;

async function loadAllocationMap(
  options: Options
): Promise<Record<string, Allocation[]>> {
  if (!_allocationMap) {
    const response = await fetch(options.allocationsSource, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    });
    _allocationMap = createAllocationMap(await response.json());
  }

  return _allocationMap;
}

export async function strategy(
  space: string,
  network: string,
  provider,
  addresses: string[],
  options: Options,
  snapshot: number | string = 'latest'
) {
  const allocationMap = await loadAllocationMap(options);

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const multi = new Multicaller(network, provider, abi, {
    blockTag,
    limit: 250
  });

  // Get current vesting state from smart contract using the vestingId
  addresses.forEach((address) => {
    const addressAllocations = allocationMap[address];

    if (addressAllocations) {
      addressAllocations.forEach(({ contract, vestingId }) => {
        multi.call(vestingId, contract, 'vestings', [vestingId]);
      });
    }
  });

  const vestings = await multi.execute();

  // Check vesting state, consider only unclaimed amounts and group allocations to the same account
  return Object.keys(vestings).reduce((result, key) => {
    // get it from the map by vestingId. A entry is guaranteed to exist
    const [{ account, amount }] = allocationMap[key]!;

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

    const previousAmount = result[account];
    // If account received multiple allocations sum them
    // Else we just return the currentAmount
    const pendingVestedAmount = previousAmount
      ? parseUnits(previousAmount.toString()).add(currentVestingAmount)
      : currentVestingAmount;

    return Object.assign(result, {
      [account]: parseFloat(formatUnits(pendingVestedAmount))
    });
  }, {} as Record<string, number>);
}

function createAllocationMap(
  rawAllocations: any[][]
): Record<string, Allocation[]> {
  const result: Record<string, Allocation[]> = {};

  for (const rawAllocation of rawAllocations.flat()) {
    const { account, contract, vestingId, amount } = rawAllocation;

    if (
      !isAddress(account) ||
      !isAddress(contract) ||
      (!isHexString(vestingId) && vestingId.length == 66) ||
      String(BigInt(amount)) != amount
    ) {
      throw new Error(`Invalid Allocation Entry: ${rawAllocation}`);
    }

    if (!result[account]) {
      result[account] = [];
    }

    if (!result[vestingId]) {
      result[vestingId] = [];
    }

    // trimmed down allocation
    const allocation = { account, contract, vestingId, amount };

    result[account].push(allocation);
    result[vestingId].push(allocation);
  }

  return result;
}
