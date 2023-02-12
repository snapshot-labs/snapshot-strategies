import { formatUnits } from '@ethersproject/units';
import { multicall, Multicaller } from '../../utils';
import { BigNumberish } from '@ethersproject/bignumber';
import networks from '@snapshot-labs/snapshot.js/src/networks.json';

export const author = 'eabz';
export const version = '0.1.0';

const abi = [
  'function getEthBalance(address addr) public view returns (uint256 balance)'
];

const validator_abi = [
  'function idByStakingAddress(address addr) external view returns(uint256)'
];

const stake_getpools_abi = [
  'function getDelegatorPools(address _delegator,uint256 _offset,uint256 _length) external view returns(uint256[] memory result)'
];

const stake_amount_abi = [
  'function stakeAmount(uint256,address) external view returns(uint256)'
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

  const multi_pool = new Multicaller(network, provider, validator_abi, {
    blockTag
  });

  addresses.forEach((address) =>
    multi_pool.call(address, options.validators, 'idByStakingAddress', [
      address
    ])
  );

  const multi_delegated = new Multicaller(
    network,
    provider,
    stake_getpools_abi,
    {
      blockTag
    }
  );

  addresses.forEach((address) =>
    multi_delegated.call(address, options.staking, 'getDelegatorPools', [
      address,
      0,
      0
    ])
  );

  const result_pools: Record<string, BigNumberish> = await multi_pool.execute();
  const result_delegated_pools: Record<string, BigNumberish[]> =
    await multi_delegated.execute();

  const multi_own_staked = new Multicaller(
    network,
    provider,
    stake_amount_abi,
    {
      blockTag
    }
  );

  const multi_staked = new Multicaller(network, provider, stake_amount_abi, {
    blockTag
  });

  for (let i = 0; i < addresses.length; i++) {
    const pool = result_pools[addresses[i]];
    if (pool.toString() !== '0') {
      multi_own_staked.call(addresses[i], options.staking, 'stakeAmount', [
        pool,
        '0x0000000000000000000000000000000000000000'
      ]);
    }
    const pools = result_delegated_pools[addresses[i]];
    for (const pool of pools) {
      multi_staked.call(
        addresses[i] + '-' + pool.toString(),
        options.staking,
        'stakeAmount',
        [pool, addresses[i]]
      );
    }
  }

  const final_balances = {};

  const result_pools_own: Record<string, BigNumberish> =
    await multi_own_staked.execute();

  const result_pools_staked: Record<string, BigNumberish> =
    await multi_staked.execute();

  Object.keys(result_pools_own).map((addr) => {
    final_balances[addr] = parseFloat(
      formatUnits(result_pools_own[addr].toString())
    );
  });

  Object.keys(result_pools_staked).map((addr) => {
    const address = addr.split('-');
    const addition = parseFloat(
      formatUnits(result_pools_staked[addr].toString())
    );
    if (final_balances[address[0]]) {
      final_balances[address[0]] += addition;
    } else {
      final_balances[address[0]] = addition;
    }
  });

  const response = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      networks[network].multicall,
      'getEthBalance',
      [address]
    ]),
    { blockTag }
  );

  const balances = Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits(value.toString(), 18))
    ])
  );

  Object.keys(balances).map((account) => {
    if (final_balances[account]) {
      balances[account] += final_balances[account];
    }
  });

  return balances;
}
