import { BigNumberish, BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'd10r';
export const version = '0.1.0';

// signatures of the methods we need
const abi = [
  // LockerFactory
  'function getLockerAddress(address user) external view returns (address)',
  'function isLockerCreated(address locker) external view returns (bool isCreated)',
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

  const mCall1 = new Multicaller(network, provider, abi, { blockTag });

  // lockerFactory.getLockerAddress(). Returns the deterministic address.
  // TODO: here it would be good to also get a bool "exists"
  addresses.forEach((address) =>
    mCall1.call(address, options.lockerFactoryAddress, 'getLockerAddress', [address])
  );
  const mc1Result: Record<string, string> = await mCall1.execute();

  const lockerAddresses = Object.values(mc1Result);

  // check if they exist (can't yet do that in a single call)
  const mCall2 = new Multicaller(network, provider, abi, { blockTag });
  lockerAddresses.forEach((lockerAddress) =>
    mCall2.call(lockerAddress, options.lockerFactoryAddress, 'isLockerCreated', [lockerAddress])
  );
  const mc2Result: Record<string, boolean> = await mCall2.execute();
  const existingLockers = Object.keys(mc2Result).filter(key => mc2Result[key] === true);

  // Now we have all locker adresses and can get the amounts for each user
  const mCall3 = new Multicaller(network, provider, abi, { blockTag });
  existingLockers.forEach((lockerAddress) =>
    mCall3.call(`available-${lockerAddress}`, lockerAddress, 'getAvailableBalance', [])
  );
  existingLockers.forEach((lockerAddress) =>
    mCall3.call(`staked-${lockerAddress}`, lockerAddress, 'getStakedBalance', [])
  );
  const mc3Result: Record<string, BigNumberish> = await mCall3.execute();

  // Create a map for each address to the sum of available and staked balance
  const balanceMap = Object.fromEntries(
    addresses.map(address => {
      const lockerAddress = mc1Result[address];
      if (lockerAddress) {
        const availableBalance = mc3Result[`available-${lockerAddress}`] || BigNumber.from(0);
        const stakedBalance = mc3Result[`staked-${lockerAddress}`] || BigNumber.from(0);
        const totalBalance = BigNumber.from(availableBalance).add(BigNumber.from(stakedBalance));
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
