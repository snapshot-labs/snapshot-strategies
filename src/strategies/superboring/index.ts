import { BigNumberish, BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'didi';
export const version = '0.1.0';

const superBoringAbi = [
  'function getSleepPod(address staker) external view returns (address)'
];

const tokenAbi = [
  'function balanceOf(address account) external view returns (uint256)'
];

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

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

  // Get the pods associated to the addresses
  const podMulti = new Multicaller(network, provider, superBoringAbi, { blockTag });
  addresses.forEach((address) =>
    podMulti.call(address, options.superBoringAddress, 'getSleepPod', [ address ])
  );
  const podsResult: Record<string, string> = await podMulti.execute();
  const podAddrs = Object.values(podsResult)
    .filter((podAddr) => podAddr !== ZERO_ADDRESS);

  // Get the balances of the addresses and their pods
  const multi = new Multicaller(network, provider, tokenAbi, { blockTag });
  addresses.forEach((address) =>
    multi.call(address, options.tokenAddress, 'balanceOf', [address])
  );
  podAddrs.forEach((address) =>
    multi.call(address, options.tokenAddress, 'balanceOf', [address])
  );
  const balancesResult: Record<string, BigNumberish> = await multi.execute();

  // Now add pod's balances to their owner's balances
  const combinedBalances: Record<string, BigNumber> = {};
  addresses.forEach((address) => {
    combinedBalances[address] = BigNumber.from(balancesResult[address] || 0);
  });
  podAddrs.forEach((podAddr) => {
    const ownerAddr = Object.keys(podsResult).find(key => podsResult[key] === podAddr) as string;
    combinedBalances[ownerAddr] = combinedBalances[ownerAddr].add(BigNumber.from(balancesResult[podAddr] || 0));
  });

  return Object.fromEntries(
    Object.entries(combinedBalances).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, DECIMALS))
    ])
  );
}
