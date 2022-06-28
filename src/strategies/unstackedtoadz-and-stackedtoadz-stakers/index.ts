import { BigNumberish } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';

export const author = 'Eh-Marine';
export const version = '0.1.0';

const stakingAbi = [
  'function depositsOf(address account) external view  returns (uint256[] memory)'
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

  const stacked_stakingPool = new Multicaller(network, provider, stakingAbi, {
    blockTag
  });
  const unstacked_stakingPool = new Multicaller(network, provider, stakingAbi, {
    blockTag
  });

  addresses.forEach((address) => {
    stacked_stakingPool.call(
      address,
      options.staking_stackedtoadz,
      'depositsOf',
      [address]
    );
    unstacked_stakingPool.call(
      address,
      options.staking_unstackedtoadz,
      'depositsOf',
      [address]
    );
  });

  const [stakingResponse_stacked, stackingResponse_unstacked]: [
    Record<string, BigNumberish[]>,
    Record<string, BigNumberish[]>
  ] = await Promise.all([
    stacked_stakingPool.execute(),
    unstacked_stakingPool.execute()
  ]);

  return Object.fromEntries(
    addresses.map((address) => {
      const stakingCount_stacked = stakingResponse_stacked[address].length;
      const stakingCount_unstacked = stackingResponse_unstacked[address].length;
      return [address, stakingCount_stacked + stakingCount_unstacked];
    })
  );
}
