import { BigNumber } from '@ethersproject/bignumber';
import { multicall } from '../../utils';

export const author = 'your-github-username';
export const version = '0.1.0';

// Contracts for token and staking
const ERA_TOKEN_CONTRACT = '0xA8bF0B92BE0338794d2e3b180b9643A1f0eB2914';
const STAKING_CONTRACT = '0xA88729cD1482F4B9A2cF6A9E72E8CD0a26EC3122';

// ABI for balanceOf (ERC-20) and getTotalStakedForUser
const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function getTotalStakedForUser(address user) external view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // Multicall to get wallet balances
  const walletBalanceCalls = addresses.map((address: any) => [
    ERA_TOKEN_CONTRACT,
    'balanceOf',
    [address]
  ]);

  // Multicall to get staked balances using getTotalStakedForUser function
  const stakingBalanceCalls = addresses.map((address: any) => [
    STAKING_CONTRACT,
    'getTotalStakedForUser',
    [address]
  ]);

  const [walletBalances, stakedBalances] = await Promise.all([
    multicall(network, provider, abi, walletBalanceCalls, { blockTag }),
    multicall(network, provider, abi, stakingBalanceCalls, { blockTag })
  ]);

  return Object.fromEntries(
    addresses.map((address: any, index: number) => {
      // Accessing the value from the response object
      const walletBalance = BigNumber.from(walletBalances[index]?.[0] || '0');
      const stakedBalance = BigNumber.from(stakedBalances[index]?.[0] || '0');

      // Voting logic: 1 token = 1 vote (wallet), 1 token = 2 votes (staked)
      const totalVotes = walletBalance.add(stakedBalance.mul(2));
      return [address, parseFloat(totalVotes.toString())];
    })
  );
}
