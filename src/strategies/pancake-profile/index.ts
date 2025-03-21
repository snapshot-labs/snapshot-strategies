import { getAddress } from '@ethersproject/address';
import { multicall } from '../../utils';

export const author = 'skyrocktech';
export const version = '0.0.2';

const hasRegisteredAbi = [
  'function hasRegistered(address _userAddress) view returns (bool)'
];

const getUserProfileAbi = [
  'function getUserProfile(address _userAddress) view returns (uint256, uint256, uint256, address, uint256, bool)'
];

const pancakeProfileAddress = '0xdf4dbf6536201370f95e06a0f8a7a70fe40e388a';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const { address: checkAddress } = options;

  const users = Object.fromEntries(
    addresses.map((address: any) => [getAddress(address), 0])
  );

  const hasRegistered = await multicall(
    network,
    provider,
    hasRegisteredAbi,
    addresses.map((address: any) => [
      pancakeProfileAddress,
      'hasRegistered',
      [address]
    ]),
    { blockTag }
  );

  const usersWithProfile = addresses.filter(
    (address: any, i: number) => hasRegistered[i][0]
  );

  if (usersWithProfile.length) {
    const profiles = await multicall(
      network,
      provider,
      getUserProfileAbi,
      usersWithProfile.map((user: any) => [
        pancakeProfileAddress,
        'getUserProfile',
        [user]
      ]),
      { blockTag }
    );

    usersWithProfile.forEach((user: any, i: number) => {
      users[user] = profiles[i][3] === checkAddress && profiles[i][5] ? 1 : 0;
    });
  }

  return users;
}
