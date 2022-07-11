// Step 1: Query API with addresses to get shares
// Step 2: Get number of shares
// Step 3: 
// Step 2: Query contract with a multicall and calculate 
// Fort represented by shares of owner = shares of owner * total stake on subject / total shares on subject

import fetch from 'cross-fetch';
import { Multicaller } from '../../utils';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';

export const author = 'emanuel-sol';
export const version = '0.0.1';

const STAKING_CONTRACT = '0xd2863157539b1D11F39ce23fC4834B62082F6874';
const abi = [
  'function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids) view returns (uint256[] memory)',
  'function inactiveStakeFor(uint8 subjectType, uint256 subject) view returns (uint256)',
  'function activeStakeFor(uint8 subjectType, uint256 subject) view returns (uint256)',
  'function inactiveSharesOf(uint8 subjectType, uint256 subject, address account) view returns (uint256)',
  'function sharesOf(uint8 subjectType, uint256 subject, address account) view returns (uint256)'
];

const calculateVotingPower = (userVotingPower, batchAddresses, batchShareIds, result) => {
  for (let i = 0; i < batchAddresses.length; i++) {
    if (batchAddresses[i] in userVotingPower === false) {
      userVotingPower[batchAddresses[i]] = BigNumber.from(0);
    }
    //console.log(`The balance of address ${batchAddresses[i]} for subject ${batchShareIds[i]} is ${result.balances[i]}`);
    const balance = result.balances[i];
    // const totalShares = result[batchAddresses[i]][batchShareIds[i]].activeShares.add(result[batchAddresses[i]][batchShareIds[i]].inactiveShares);
    // const totalStake = result[batchAddresses[i]][batchShareIds[i]].activeStake.add(result[batchAddresses[i]][batchShareIds[i]].inactiveStake);

    // console.log(`The totalShares of address ${batchAddresses[i]} for subject ${batchShareIds[i]} is ${totalShares}`);
    // console.log(`The totalStake of address ${batchAddresses[i]} for subject ${batchShareIds[i]} is ${totalStake}`);

    //userVotingPower[batchAddresses[i]] = balance.mul(totalStake.div(totalShares));

    userVotingPower[batchAddresses[i]] = balance;
  }
  return userVotingPower
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const params = {
    'addresses': addresses
  }

  const stakeTypeMappings = new Map();
  stakeTypeMappings.set('ScannerStake', 0);
  stakeTypeMappings.set('AgentStake', 1);


  const response = await fetch(options.url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  const data = await response.json();
  const multicall = new Multicaller(network, provider, abi, { blockTag });
  const batchAddresses = <string[]>[];
  const batchShareIds =  <string[]>[];

  data.shares.forEach((valuePair) => {
    if (valuePair.shares) {
      valuePair.shares.forEach((share) => {
        batchAddresses.push(share.shareholder);
        batchShareIds.push(share.shareId);

        multicall.call(
          `${share.shareholder}.${share.shareId}.activeShares`,
          STAKING_CONTRACT,
          'sharesOf',
          [
            stakeTypeMappings.has(share.stakeType) ? stakeTypeMappings.get(share.stakeType) : 255,
            share.shareId,
            share.shareholder]);

        multicall.call(
          `${share.shareholder}.${share.shareId}.inactiveShares`,
          STAKING_CONTRACT,
          'inactiveSharesOf',
          [
            stakeTypeMappings.has(share.stakeType) ? stakeTypeMappings.get(share.stakeType) : 255,
            share.shareId,
            share.shareholder]);
        
        multicall.call(
          `${share.shareholder}.${share.shareId}.activeStake`,
          STAKING_CONTRACT,
          'activeStakeFor',
          [
            stakeTypeMappings.has(share.stakeType) ? stakeTypeMappings.get(share.stakeType) : 255,
            share.shareId]);

        multicall.call(
          `${share.shareholder}.${share.shareId}.inactiveStake`,
          STAKING_CONTRACT,
          'inactiveStakeFor',
          [
            stakeTypeMappings.has(share.stakeType) ? stakeTypeMappings.get(share.stakeType) : 255,
            share.shareId]);
      });
    }
  });

  multicall.call(
    `balances`,
    STAKING_CONTRACT,
    'balanceOfBatch',
    [batchAddresses, batchShareIds]);
  
  const result = await multicall.execute();

  let userVotingPower = {};

  calculateVotingPower(userVotingPower, batchAddresses, batchShareIds, result);

  return Object.fromEntries(
    Object.entries(userVotingPower).map((addressBalancePair) => [
      addressBalancePair[0],
      parseFloat(formatUnits(<BigNumberish>addressBalancePair[1], 18))
    ])
  );
}
