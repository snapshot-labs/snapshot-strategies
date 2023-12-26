import { getDelegations } from '../../utils/delegation';
import { getScoresDirect } from '../../utils';
import { multicall } from '../../utils';
import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { getAddress } from '@ethersproject/address';

export const author = 'pierremarsotlyon1';
export const version = '0.1.0';
export const dependOnOtherAddress = true;

// Used ABI
const abi = [
  'function totalSupply() external view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {

  const delegationSpace = options.delegationSpace || space;

  // Fetch totalSupply + delegations data
  const calls: any[] = [
    multicall(network, provider, abi, [[options.sdTokenGauge, 'totalSupply']], { blockTag: snapshot }),
    getDelegations(
      delegationSpace,
      network,
      addresses,
      snapshot
    )
  ];

  // If we have an delegation address, fetch VP for users who voted (to minus them after)
  let delegationAddressLc = "";
  let haveDelegationAddress = false;
  if (options.delegationAddress) {

    delegationAddressLc = options.delegationAddress.toLowerCase();
    haveDelegationAddress = addresses.find((addr: string) => addr.toLowerCase() === delegationAddressLc);

    if (haveDelegationAddress) {
      // Fetch vp from users who voted
      const otherAddresses = addresses.filter((addr: string) => addr.toLowerCase() !== delegationAddressLc);
      calls.push(getScoresDirect(
        space,
        options.strategies,
        network,
        provider,
        otherAddresses,
        snapshot
      ));
    }
  }

  // Fetch
  let [callTotalSupply, delegations, ...userScores] = await Promise.all(calls);

  // Compute the total supply
  const totalSupply = parseFloat(formatUnits(BigNumber.from(callTotalSupply.shift()[0]), 18));

  if (Object.keys(delegations).length === 0) return {};

  // Just to avoid type error
  const delegationValues = Object.values(delegations) as string[][];

  // Fetch the VP for each delegates
  const scores = (
    await getScoresDirect(
      space,
      options.strategies,
      network,
      provider,
      delegationValues.reduce((a: string[], b: string[]) =>
        a.concat(b)
      ),
      snapshot
    )
  ).filter((score) => Object.keys(score).length !== 0);

  // Sum the VP for all delegators
  // ie : VP delegator = SUM(vp delegates)
  // Here we should have something like : 
  // {'0x1': 100, '0x2': 300}
  const delegationSum = Object.fromEntries(
    addresses.map((address) => {
      const addressScore = delegations[address]
        ? delegations[address].reduce(
          (a, b) => a + scores.reduce((x, y) => (y[b] ? x + y[b] : x), 0),
          0
        )
        : 0;
      return [address.toLowerCase(), addressScore];
    })
  );

  // If we have a delegation address set in the parameters, we assign it the whole VP
  // Then we reduce the VP from users who voted + VP from other delegators
  if (haveDelegationAddress) {

    // Fetch vp from users who voted
    userScores = userScores.filter((score) => Object.keys(score).length !== 0);

    // Assign the whole VP
    delegationSum[delegationAddressLc] = totalSupply;

    // Compute and remove VP from users who voted
    for (const userScore of userScores) {
      for (const obj of userScore) {
        for (const addr of Object.keys(obj)) {
          delegationSum[delegationAddressLc] -= obj[addr];
        }
      }
    }

    // Remove VP from other delegators
    for (const addr of Object.keys(delegationSum)) {
      if (addr.toLowerCase() === delegationAddressLc) {
        continue;
      }

      delegationSum[delegationAddressLc] -= delegationSum[addr];
    }
  }

  // Checksum addresses
  const checksumAddresses: any = {};
  for (const addr of Object.keys(delegationSum)) {
    checksumAddresses[getAddress(addr)] = delegationSum[addr];
  }

  return checksumAddresses;
}