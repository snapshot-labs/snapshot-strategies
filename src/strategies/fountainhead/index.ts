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

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // get unlocked amounts held by address itself
  const mCall1 = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    mCall1.call(address, options.tokenAddress, 'balanceOf', [address])
  );
  const mc0Result: Record<string, string> = await mCall1.execute();

  const mCall2 = new Multicaller(network, provider, abi, { blockTag });

  // lockerFactory.getUserLocker(). Returns the deterministic address and a bool "exists".
  addresses.forEach((address) =>
    mCall2.call(address, options.lockerFactoryAddress, 'getUserLocker', [address])
  );
  const mc1Result: Record<string, any> = await mCall2.execute();

  // Filter out addresses of existing lockers
  const existingLockers = Object.values(mc1Result)
    .filter(result => result.isCreated === true)
    .map(result => result.lockerAddress);

  // Now we have all locker adresses and can get the staked and unstaked amounts for each address...
  const mCall3 = new Multicaller(network, provider, abi, { blockTag });
  existingLockers.forEach((lockerAddress) =>
    mCall3.call(`available-${lockerAddress}`, lockerAddress, 'getAvailableBalance', [])
  );
  existingLockers.forEach((lockerAddress) =>
    mCall3.call(`staked-${lockerAddress}`, lockerAddress, 'getStakedBalance', [])
  );
  // and the fontaineCount
  existingLockers.forEach((lockerAddress) =>
    mCall3.call(`fontaineCount-${lockerAddress}`, lockerAddress, 'fontaineCount', [])
  );
  const mc3Result: Record<string, BigNumberish> = await mCall3.execute();

  // now get all the fontaine addresses
  const mCall4 = new Multicaller(network, provider, abi, { blockTag });
  existingLockers.forEach((lockerAddress) => {
    const fontaineCount = Number(mc3Result[`fontaineCount-${lockerAddress}`]);
    // iterate backwards, so we have fontaines ordered by creation time (most recent first).
    // this makes it unlikely to miss fontaines which are still active.
    for (let i = fontaineCount-1; i >= 0 && i >= fontaineCount-MAX_FONTAINES_PER_LOCKER; i--) {
      mCall4.call(`${lockerAddress}-${i}`, lockerAddress, 'fontaines', [i])
    }
  });
  const mc4Result: Record<string, string> = await mCall4.execute();

  // compile a map of locker -> fontaineCount
  const fontainesCountMap = Object.fromEntries(
    existingLockers.map((lockerAddress) => [lockerAddress, Number(mc3Result[`fontaineCount-${lockerAddress}`])])
  );

  // now we have all the fontaines, we can get the balance for each fontaine
  const mCall5 = new Multicaller(network, provider, abi, { blockTag });
  existingLockers.forEach((lockerAddress) => {
    const fontaineCount = fontainesCountMap[lockerAddress];
    // iterate over each fontaine index
    for (let i = 0; i < fontaineCount; i++) {
      const fontaineAddress = mc4Result[`${lockerAddress}-${i}`];
      // Get the token balance of the fontaine contract
      mCall5.call(`${lockerAddress}-${i}`, options.tokenAddress, 'balanceOf', [fontaineAddress]);
    }
  });
  const mc5Result: Record<string, BigNumberish> = await mCall5.execute();

  // Note: all 5 allowed multicalls are "used". We could however "free" one by combining mCall1 and mCall5 (balance queries).

  // Create a map for each address to the cumulated balance
  const balanceMap = Object.fromEntries(
    addresses.map(address => {
      const lockerAddress = mc1Result[address];
      const unlockedBalance = BigNumber.from(mc0Result[address]);

      // if no locker -> return unlocked balance
      if (!lockerAddress) return [address, unlockedBalance];

      // else add all balances in locker and related fontaines
      const availableBalance = BigNumber.from(mc3Result[`available-${lockerAddress}`] || 0);
      const stakedBalance = BigNumber.from(mc3Result[`staked-${lockerAddress}`] || 0);
      const fontaineBalances = getFontaineBalancesForLocker(lockerAddress, fontainesCountMap[lockerAddress], mc5Result);

      const totalBalance = unlockedBalance
        .add(availableBalance)
        .add(stakedBalance)
        .add(fontaineBalances);

      return [address, totalBalance];
    })
  );

  // Return in the required format
  return Object.fromEntries(
    Object.entries(balanceMap).map(([address, balance]) => [
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
    .map((_, i) => BigNumber.from(balances[`balance-${lockerAddress}-${i}`] || 0))
    .reduce(
      (sum, balance) => sum.add(balance),
      BigNumber.from(0)
    );
}