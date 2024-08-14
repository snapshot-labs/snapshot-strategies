import { Multicaller } from '../../utils';

export const author = 'dramacrypto';
export const version = '0.1.0';

const stakingAbi = [
  'function stakedNfts(address _account, uint256 _offset, uint256 _count) external view returns (uint256[])'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const fixedStakingMulti = new Multicaller(network, provider, stakingAbi, {
    blockTag
  });
  addresses.forEach((address) =>
    fixedStakingMulti.call(
      address,
      options.fixed_staking_address,
      'stakedNfts',
      [address, 0, 10000]
    )
  );
  const fixedStakingResults: Record<string, any> =
    await fixedStakingMulti.execute();

  const sharedStakingMulti = new Multicaller(network, provider, stakingAbi, {
    blockTag
  });
  addresses.forEach((address) =>
    sharedStakingMulti.call(
      address,
      options.shared_staking_address,
      'stakedNfts',
      [address, 0, 10000]
    )
  );
  const sharedStakingResults: Record<string, any> =
    await sharedStakingMulti.execute();

  return Object.fromEntries(
    Object.entries(fixedStakingResults).map(([address, fixedStakedNfts]) => {
      const stakedNftCount =
        fixedStakedNfts.length + sharedStakingResults[address].length;
      return [address, stakedNftCount];
    })
  );
}
