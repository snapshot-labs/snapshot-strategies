import fetch from 'cross-fetch';
import { multicall } from '../../utils';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';

export const author = 'emanuel-sol';
export const version = '0.0.1';

const STAKING_CONTRACT = '0xd2863157539b1D11F39ce23fC4834B62082F6874';
const abi = [
  'function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids) view returns (uint256[] memory)'
];

const calculateVotingPower = (userVotingPower, batchAddresses, result) => {
  for (let i = 0; i < batchAddresses.length; i++) {
    if (batchAddresses[i] in userVotingPower === false) {
      userVotingPower[batchAddresses[i]] = BigNumber.from(0);
    }
    const balance = result.balances[i];

    userVotingPower[batchAddresses[i]] = userVotingPower[batchAddresses[i]].add(balance);
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

  const response = await fetch("https://api.forta.network/stats/shares/", {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  const data = await response.json();

  const batchAddresses = <string[]>[];
  const batchShareIds =  <string[]>[];

  data.shares.forEach((valuePair) => {
    if (valuePair.shares) {
      valuePair.shares.forEach((share) => {
        batchAddresses.push(share.shareholder);
        batchShareIds.push(share.shareId);
      });
    }
  });

  console.log(provider);

  const result = await multicall(
    network,
    provider,
    abi,
    [
      [STAKING_CONTRACT, 'balanceOfBatch', [batchAddresses, batchShareIds]]
    ],
    { blockTag }
  );

  let userVotingPower = {};

  userVotingPower = calculateVotingPower(userVotingPower, batchAddresses, result);

  return Object.fromEntries(
    Object.entries(userVotingPower).map((addressBalancePair) => [
      addressBalancePair[0],
      parseFloat(formatUnits(<BigNumberish>addressBalancePair[1], 18))
    ])
  );
}
