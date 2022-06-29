import { strategy as contractCall } from '../contract-call';

export const author = 'rafaqat11';
export const version = '0.1.0';

const abi_erc20 = {
  inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
  name: 'balanceOf',
  outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
  stateMutability: 'view',
  type: 'function'
};

const abi_pilot_staking = {
  inputs: [{ internalType: 'address', name: '', type: 'address' }],
  name: 'userInfo',
  outputs: [
    {
      internalType: 'uint256',
      name: 'lastUpdateRewardToken',
      type: 'uint256'
    },
    { internalType: 'uint256', name: 'amount', type: 'uint256' },
    { internalType: 'uint256', name: 'rewardDebt', type: 'uint256' }
  ],
  stateMutability: 'view',
  type: 'function'
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const _addresses = addresses.map((address: string) => address.toLowerCase());

  const multi_balance_promise = contractCall(
    space,
    network,
    provider,
    _addresses,
    {
      ...options,
      address: options?.tokenAddress,
      methodABI: abi_erc20
    },
    snapshot
  );

  const multi_staking_promise = contractCall(
    space,
    network,
    provider,
    _addresses,
    {
      ...options,
      address: options?.stakingAddress,
      methodABI: abi_pilot_staking,
      output: 'amount'
    },
    snapshot
  );

  const [multi_balance, multi_staking] = await Promise.all([
    multi_balance_promise,
    multi_staking_promise
  ]);

  return Object.fromEntries(
    _addresses.map((address: string) => [
      address,
      multi_balance[address] + multi_staking[address]
    ])
  );
}
