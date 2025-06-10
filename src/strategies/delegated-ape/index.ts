import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import networks from '@snapshot-labs/snapshot.js/src/networks.json';
import { Multicaller } from '../../utils';

export const author = 'snapshot-labs';
export const version = '0.1.0';

const abi = [
  'function delegation(address delegator, bytes32 id) view returns (address delegate)',
  'function getDelegators(address delegate, bytes32 id) view returns (address[])',
  'function getEthBalance(address account) public view returns (uint256 balance)'
];

const DELEGATION_CONTRACT_ADDRESS = '0xdd6b74123b2ab93ad701320d3f8d1b92b4fa5202';
const DELEGATION_ID =
  '0x0000000000000000000000000000000000000000000000000000000000000001';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export async function strategy(
  space: string,
  network: string,
  provider: any,
  addresses: string[],
  options: any,
  snapshot: string | number
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const delegationMulticall = new Multicaller(network, provider, abi, {
    blockTag
  });

  addresses.forEach((address: string) => {
    delegationMulticall.call(
      `delegation.${address}`,
      DELEGATION_CONTRACT_ADDRESS,
      'delegation',
      [address, DELEGATION_ID]
    );
    delegationMulticall.call(
      `delegators.${address}`,
      DELEGATION_CONTRACT_ADDRESS,
      'getDelegators',
      [address, DELEGATION_ID]
    );
  });

  const results = await delegationMulticall.execute();

  const allDelegators = new Set<string>();

  addresses.forEach((voterAddress: string) => {
    const delegation = results.delegation[voterAddress];
    const delegators = results.delegators[voterAddress] || [];

    delegators.forEach((delegator: string) => {
      allDelegators.add(delegator.toLowerCase());
    });

    if (delegation === ZERO_ADDRESS) {
      allDelegators.add(voterAddress.toLowerCase());
    }
  });

  const balanceMulticall = new Multicaller(
    network,
    provider,
    [
      'function getEthBalance(address addr) public view returns (uint256 balance)'
    ],
    { blockTag }
  );

  Array.from(allDelegators).forEach((delegator: string) => {
    balanceMulticall.call(
      delegator,
      networks[network].multicall,
      'getEthBalance',
      [delegator]
    );
  });

  const balanceResults: Record<string, BigNumberish> =
    await balanceMulticall.execute();

  const scores: Record<string, number> = {};

  addresses.forEach((voterAddress: string) => {
    const delegation = results.delegation[voterAddress];
    const delegators = results.delegators[voterAddress] || [];

    let totalVotingPower = BigNumber.from(0);

    delegators.forEach((delegator: string) => {
      const balance = balanceResults[delegator.toLowerCase()] || 0;
      totalVotingPower = totalVotingPower.add(BigNumber.from(balance));
    });

    if (delegation === ZERO_ADDRESS) {
      const voterBalance = balanceResults[voterAddress.toLowerCase()] || 0;
      totalVotingPower = totalVotingPower.add(BigNumber.from(voterBalance));
    }

    scores[getAddress(voterAddress)] = parseFloat(
      formatUnits(totalVotingPower, 18)
    );
  });

  return scores;
}
