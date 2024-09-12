import { BigNumberish, BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

/// See https://app.superboring.xyz

export const author = 'd10r';
export const version = '0.1.0';

// subset of SuperBoring methods we need
const superBoringAbi = [
  'function getSleepPod(address staker) external view returns (address)',
  'function getAllTorexesMetadata() external view returns ((address, address, address)[])',
  'function getStakedAmountOf(address torex, address staker) public view returns (uint256 stakedAmount)'
];

// subset of token methods we need
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

  // Construct first batch call to SuperBoring contract
  const sbMultiCall = new Multicaller(network, provider, superBoringAbi, { blockTag });

  // Get the sleep pod for each address (will return zero if not exists)
  addresses.forEach((address) =>
    sbMultiCall.call(address, options.superBoringAddress, 'getSleepPod', [ address ])
  );

  // Get all torexes
  sbMultiCall.call('torexes', options.superBoringAddress, 'getAllTorexesMetadata')

  // execute.
  // This will return an object with 2 kinds of elements:
  // - 1 element with key "torexes" and value an array of tuples with 3 addresses, the first of which is the torex address
  // - elements with address as key (one for each user), with the corresponding sleep pod address (zero if not exists) as value
  const sbResult: Record<string, any> = await sbMultiCall.execute();

  // extract the map from user address to pod address
  const podsMap = Object.fromEntries(
    Object.entries(sbResult).filter(([key]) => key !== 'torexes')
  );

  // extract the addresses of regitered torexes
  const torexAddrs = Array.isArray(sbResult['torexes'])
    ? sbResult['torexes'].map(tuple => tuple[0])
    : [];

  // Now we have all torex adresses and can get the staked amounts for each user

  // Construct second batch call to SuperBoring contract
  // Since the SuperBoring contract does (corrently) not allow to query the overall staked amount of a user,
  // we need to query for each combination of user and torex
  const sbMulti2 = new Multicaller(network, provider, superBoringAbi, { blockTag });
  addresses.forEach((address) =>
    torexAddrs.forEach((torexAddr) =>
      sbMulti2.call(`${address}-${torexAddr}`, options.superBoringAddress, 'getStakedAmountOf', [ torexAddr, address ])
    )
  );

  // execute.
  // This returns an object with elements with keys of the form "userAddr-torexAddr" and values the staked amount
  const sbResult2: Record<string, any> = await sbMulti2.execute();

  // Transform to a map from user address to total staked amount
  const stakesMap = Object.keys(sbResult2).reduce((acc, key) => {
    const [address, ] = key.split('-');
    acc[address] = (acc[address] || BigNumber.from(0)).add(sbResult2[key]);
    return acc;
  }, {});

  // In the next multicall, we get the unstaked balances of users and pods, querying the token contract

  const tokenMultiCall = new Multicaller(network, provider, tokenAbi, { blockTag });

  // Get the balance of each address
  addresses.forEach((address) =>
    tokenMultiCall.call(address, options.tokenAddress, 'balanceOf', [address])
  );

  // Get the balance of each pod (we filter out the zero addresses which represent non-existing pods)
  Object.values(podsMap)
    .filter(podAddr => podAddr !== ZERO_ADDRESS)
    .forEach((podAddr) =>
      tokenMultiCall.call(podAddr, options.tokenAddress, 'balanceOf', [podAddr])
    );

  // execute.
  // The returned object will have one element for each user and each pod, with their address as key and the balance as value
  const balancesResult: Record<string, BigNumberish> = await tokenMultiCall.execute();

  // Now add up the 3 balance components per user: directly owned + held by pod + staked
  const balanceMap: Record<string, BigNumber> = {};
  addresses.forEach((address) => {
    balanceMap[address] =
      BigNumber.from(balancesResult[address]) // directly owned
      .add(BigNumber.from(balancesResult[podsMap[address]] || 0)) // held by pod
      .add(BigNumber.from(stakesMap[address])); // staked
  });

  // Return in the required format
  return Object.fromEntries(
    Object.entries(balanceMap).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, DECIMALS))
    ])
  );
}
