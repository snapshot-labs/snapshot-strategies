import { BigNumberish, BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'd10r';
export const version = '0.1.0';

// signatures of the methods we need
const abi = [
  // LockerFactory
  'function getUserLocker(address user) external view returns (bool isCreated, address lockerAddress)',
  // Locker
  'function getAvailableBalance() external view returns(uint256)',
  'function getStakedBalance() external view returns(uint256)',
  'function fontaineCount() external view returns(uint16)',
  'function fontaines(uint256 unlockId) external view returns(address)',
  // Token
  'function balanceOf(address account) external view returns (uint256)'
];

// Super Tokens always have 18 decimals
const DECIMALS = 18;

// we must bound the number of fontaines per locker to avoid RPC timeouts
const MAX_FONTAINES_PER_LOCKER = 100;

interface LockerState {
  availableBalance: BigNumber;
  stakedBalance: BigNumber;
  fontaineCount: number;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // 1. GET UNLOCKED BALANCES
  const mCall1 = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    mCall1.call(address, options.tokenAddress, 'balanceOf', [address])
  );
  const unlockedBalances: Record<string, BigNumberish> = await mCall1.execute();

  // 2. GET LOCKER ADDRESSES
  const mCall2 = new Multicaller(network, provider, abi, { blockTag });
  // lockerFactory.getUserLocker(). Returns the deterministic address and a bool "exists".
  addresses.forEach((address) =>
    mCall2.call(address, options.lockerFactoryAddress, 'getUserLocker', [
      address
    ])
  );
  const mCall2Result: Record<string, any> = await mCall2.execute();
  const lockerByAddress = Object.fromEntries(
    Object.entries(mCall2Result)
      .filter(([, { isCreated }]) => isCreated)
      .map(([addr, { lockerAddress }]) => [addr, lockerAddress])
  );
  const existingLockers = Object.values(lockerByAddress);

  // 3. GET LOCKER STATE (available balance, staked balance, fontaine count)
  const mCall3 = new Multicaller(network, provider, abi, { blockTag });
  existingLockers.forEach((lockerAddress) => {
    mCall3.call(
      `available-${lockerAddress}`,
      lockerAddress,
      'getAvailableBalance',
      []
    );
    mCall3.call(
      `staked-${lockerAddress}`,
      lockerAddress,
      'getStakedBalance',
      []
    );
    mCall3.call(
      `fontaineCount-${lockerAddress}`,
      lockerAddress,
      'fontaineCount',
      []
    );
  });
  const mCall3Result: Record<string, BigNumberish> = await mCall3.execute();
  // Transform raw results into structured data
  const lockerStates: Record<string, LockerState> = {};
  existingLockers.forEach((lockerAddress) => {
    lockerStates[lockerAddress] = {
      availableBalance: BigNumber.from(
        mCall3Result[`available-${lockerAddress}`] || 0
      ),
      stakedBalance: BigNumber.from(
        mCall3Result[`staked-${lockerAddress}`] || 0
      ),
      fontaineCount: Number(mCall3Result[`fontaineCount-${lockerAddress}`])
    };
  });

  // 4. GET ALL THE FONTAINES
  const mCall4 = new Multicaller(network, provider, abi, { blockTag });
  existingLockers.forEach((lockerAddress) => {
    const fontaineCount = lockerStates[lockerAddress].fontaineCount;
    // iterate backwards, so we have fontaines ordered by creation time (most recent first).
    // this makes it unlikely to miss fontaines which are still active.
    for (
      let i = fontaineCount - 1;
      i >= 0 && i >= fontaineCount - MAX_FONTAINES_PER_LOCKER;
      i--
    ) {
      mCall4.call(`${lockerAddress}-${i}`, lockerAddress, 'fontaines', [i]);
    }
  });
  const fontaineAddrs: Record<string, string> = await mCall4.execute();

  // 5. GET THE FONTAINE'S BALANCES
  const mCall5 = new Multicaller(network, provider, abi, { blockTag });
  existingLockers.forEach((lockerAddress) => {
    for (let i = 0; i < lockerStates[lockerAddress].fontaineCount; i++) {
      const fontaineAddress = fontaineAddrs[`${lockerAddress}-${i}`];
      mCall5.call(`${lockerAddress}-${i}`, options.tokenAddress, 'balanceOf', [
        fontaineAddress
      ]);
    }
  });
  const fontaineBalances: Record<string, BigNumberish> = await mCall5.execute();

  // Note: all 5 allowed multicalls are "used".
  // If needed we could "free" one by combining the balance queries of mCall1 and mCall5

  // SUM UP ALL THE BALANCES
  const balances = Object.fromEntries(
    addresses.map((address) => {
      const lockerAddress: string = lockerByAddress[address];
      const unlockedBalance = BigNumber.from(unlockedBalances[address]);

      // if no locker -> return unlocked balance
      if (!lockerAddress) return [address, unlockedBalance];

      // else add all balances in locker and related fontaines
      const availableBalance = lockerStates[lockerAddress].availableBalance;
      const stakedBalance = lockerStates[lockerAddress].stakedBalance;
      const fontaineBalanceSum = getFontaineBalancesForLocker(
        lockerAddress,
        lockerStates[lockerAddress].fontaineCount,
        fontaineBalances
      );

      const totalBalance = unlockedBalance
        .add(availableBalance)
        .add(stakedBalance)
        .add(fontaineBalanceSum);

      return [address, totalBalance];
    })
  );

  // Return in the required format
  return Object.fromEntries(
    Object.entries(balances).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, DECIMALS))
    ])
  );
}

// helper function to sum up the fontaine balances for a given locker
function getFontaineBalancesForLocker(
  lockerAddress: string,
  fontaineCount: number,
  balances: Record<string, BigNumberish>
): BigNumber {
  return Array.from({ length: fontaineCount })
    .map((_, i) =>
      BigNumber.from(balances[`balance-${lockerAddress}-${i}`] || 0)
    )
    .reduce((sum, balance) => sum.add(balance), BigNumber.from(0));
}
