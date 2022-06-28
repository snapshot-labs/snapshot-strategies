import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'rafaqat11';
export const version = '0.1.0';

const abi_erc20 = [
  'function balanceOf(address account) external view returns (uint256)'
];

const abi_pilot_staking = [
  {
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
  }
];

export async function strategy(
  _space,
  network,
  _provider,
  addresses,
  options,
  snapshot
) {
  const _addresses = addresses.map((address) => address.toLowerCase());

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi_balance = new Multicaller(network, _provider, abi_erc20, {
    blockTag
  });
  const multi_staking = new Multicaller(network, _provider, abi_pilot_staking, {
    blockTag
  });

  _addresses.forEach((address) => {
    multi_balance.call(address, options.tokenAddress, 'balanceOf', [address]);
    multi_staking.call(address, options.stakingAddress, 'userInfo', [address]);
  });

  const [result_balance, result_staking]: [Record<string, BigNumberish>, any] =
    await Promise.all([multi_balance.execute(), multi_staking.execute()]);

  let r = Object.fromEntries(
    _addresses.map((address) => [
      address,
      parseFloat(
        formatUnits(result_balance[address].toString(), options.decimals)
      ) +
        parseFloat(
          formatUnits(
            result_staking[address].amount.toString(),
            options.decimals
          )
        )
    ])
  );

  console.log(r);

  return r;
}
