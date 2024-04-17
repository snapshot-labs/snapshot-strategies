import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'kaiserpy';
export const version = '0.1.0';

const abi = [
  'function getVotes(address account) external view returns (uint256)',
  'function votingPowerWithoutDelegation(address account) external view returns (uint256)',
  'function delegates(address account) external view returns (address)'
];

const STAKED_NOTE_CONTRACT_ADDRESS =
  '0x38de42f4ba8a35056b33a746a6b45be9b1c3b9d2';

interface VotingInfo {
  [address: string]: BigNumberish;
}

export async function strategy(
  space: any,
  network: string,
  provider: any,
  addresses: string[],
  options: any,
  snapshot: number | string
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // Helper function to fetch data using multicall
  async function fetchMulticallData(method: string) {
    const multi = new Multicaller(network, provider, abi, { blockTag });
    addresses.forEach((address) =>
      multi.call(address, STAKED_NOTE_CONTRACT_ADDRESS, method, [address])
    );
    return await multi.execute();
  }

  // Fetch delegate votes, non-delegated votes, and delegation information
  const delegatedVotes: VotingInfo = await fetchMulticallData('getVotes');
  const nonDelegatedVotes: VotingInfo = await fetchMulticallData(
    'votingPowerWithoutDelegation'
  );
  const delegationInfo: Record<string, boolean> = await fetchMulticallData(
    'delegates'
  ).then((result2: Record<string, string>) =>
    Object.fromEntries(
      Object.entries(result2).map(([address, delegate]) => [
        address,
        delegate.toLowerCase() === '0x0000000000000000000000000000000000000000'
      ])
    )
  );

  // Process and filter the data
  const delegateVotingPowers = Object.fromEntries(
    Object.entries(delegatedVotes).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, 8))
    ])
  );
  const votingPowers = Object.fromEntries(
    Object.entries(nonDelegatedVotes).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, 8))
    ])
  );

  const filteredBalances: Record<string, number> = {};
  addresses.forEach((address) => {
    if (delegationInfo[address]) {
      const delegateVotingPower = delegateVotingPowers[address] || 0;
      const votingPower = votingPowers[address] || 0;
      filteredBalances[address] = delegateVotingPower + votingPower;
    }
  });

  return filteredBalances;
}
