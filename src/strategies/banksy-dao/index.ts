import { Multicaller } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'BanksyFarm';
export const version = '0.0.1';

const factoryNftABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
  'function getArtWorkOverView(uint256 tokenId) external view returns (uint256, uint256, uint256)'
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

  // First, get the balance of nft
  const callWalletToBalanceOf = new Multicaller(
    network,
    provider,
    factoryNftABI,
    {
      blockTag
    }
  );
  for (const walletAddress of addresses) {
    callWalletToBalanceOf.call(walletAddress, options.address, 'balanceOf', [
      walletAddress
    ]);
  }
  const walletToBalanceOf: Record<string, BigNumber> =
    await callWalletToBalanceOf.execute();

  // Second, get the tokenId's for each nft
  const callWalletToAddresses = new Multicaller(
    network,
    provider,
    factoryNftABI,
    {
      blockTag
    }
  );
  for (const [walletAddress, count] of Object.entries(walletToBalanceOf)) {
    for (let index = 0; index < count.toNumber(); index++) {
      callWalletToAddresses.call(
        walletAddress.toString() + '-' + index.toString(),
        options.address,
        'tokenOfOwnerByIndex',
        [walletAddress, index]
      );
    }
  }
  const walletIDToAddresses: Record<string, BigNumber> =
    await callWalletToAddresses.execute();

  // Third, get skil's for each tokenId
  const callTokenToSkill = new Multicaller(network, provider, factoryNftABI, {
    blockTag
  });

  for (const [walletID, tokenId] of Object.entries(walletIDToAddresses)) {
    callTokenToSkill.call(walletID, options.address, 'getArtWorkOverView', [
      tokenId
    ]);
  }
  const walletIDToSkills: Record<string, any> =
    await callTokenToSkill.execute();

  const results = {} as Record<string, number>;
  for (const [walletID, values] of Object.entries(walletIDToSkills)) {
    const address = walletID.split('-')[0];
    const currentExperience = values[1] / 1e18;

    let extraBoosted = 1;
    if (currentExperience > 0) {
      extraBoosted = currentExperience / 100;
    }

    results[address] = (results[address] || 0) + extraBoosted;
  }

  return Object.fromEntries(
    Object.entries(results).map(([address, weight]) => [address, weight])
  );
}
