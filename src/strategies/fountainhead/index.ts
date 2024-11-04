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
  // Token
  'function balanceOf(address account) external view returns (uint256)'
];

// Super Tokens always have 18 decimals
const DECIMALS = 18;

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
  const mCall0 = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    mCall0.call(address, options.tokenAddress, 'balanceOf', [address])
  );
  const mc0Result: Record<string, string> = await mCall0.execute();

  const mCall1 = new Multicaller(network, provider, abi, { blockTag });

  // lockerFactory.getUserLocker(). Returns the deterministic address and a bool "exists".
  addresses.forEach((address) =>
    mCall1.call(address, options.lockerFactoryAddress, 'getUserLocker', [address])
  );
  const mc1Result: Record<string, any> = await mCall1.execute();

  // Filter out addresses of existing lockers
  const existingLockers = Object.values(mc1Result)
    .filter(result => result.isCreated === true)
    .map(result => result.lockerAddress);

  // Now we have all locker adresses and can get the staked and unstaked amounts for each address
  const mCall3 = new Multicaller(network, provider, abi, { blockTag });
  existingLockers.forEach((lockerAddress) =>
    mCall3.call(`available-${lockerAddress}`, lockerAddress, 'getAvailableBalance', [])
  );
  existingLockers.forEach((lockerAddress) =>
    mCall3.call(`staked-${lockerAddress}`, lockerAddress, 'getStakedBalance', [])
  );
  const mc3Result: Record<string, BigNumberish> = await mCall3.execute();

  // Create a map for each address to the cumulated balance
  const balanceMap = Object.fromEntries(
    addresses.map(address => {
      const lockerAddress = mc1Result[address];
      if (lockerAddress) {
        const unlockedBalance = BigNumber.from(mc0Result[address]);
        const availableBalance = BigNumber.from(mc3Result[`available-${lockerAddress}`] || 0);
        const stakedBalance = BigNumber.from(mc3Result[`staked-${lockerAddress}`] || 0);
        const totalBalance = unlockedBalance.add(availableBalance).add(stakedBalance);
        return [address, totalBalance];
      } else {
        return [address, BigNumber.from(0)];
      }
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
