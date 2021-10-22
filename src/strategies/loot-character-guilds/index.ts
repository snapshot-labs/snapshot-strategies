import { Multicaller } from '../../utils';

export const author = 'jordanmessina';
export const version = '0.1.0';

const lootAbi = [
  'function balanceOf(address owner) external view returns (uint256 balance)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId)'
];

const lootCharacterGuildsAbi = [
  'function guildLoots(uint256 tokenId) external view returns (uint256 guild)'
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

  const lootBalanceOfMulti = new Multicaller(network, provider, lootAbi, {
    blockTag
  });
  addresses.forEach((address) => {
    lootBalanceOfMulti.call(address, options.lootAddress, 'balanceOf', [
      address
    ]);
  });
  const lootBalanceOfResult = await lootBalanceOfMulti.execute();

  const lootTokenOwnerMulti = new Multicaller(network, provider, lootAbi, {
    blockTag
  });
  for (const [address, balance] of Object.entries<number>(
    lootBalanceOfResult
  )) {
    for (let i = 0; i < balance; i++) {
      lootTokenOwnerMulti.call(
        `${address}-${i}`,
        options.lootAddress,
        'tokenOfOwnerByIndex',
        [address, String(i)]
      );
    }
  }
  const lootBagOwners = await lootTokenOwnerMulti.execute();

  const guildLootsMulti = new Multicaller(
    network,
    provider,
    lootCharacterGuildsAbi,
    { blockTag }
  );
  for (const [addressAndBagIndex, bagId] of Object.entries(lootBagOwners)) {
    guildLootsMulti.call(
      addressAndBagIndex,
      options.lootCharacterGuildsAddress,
      'guildLoots',
      [String(bagId)]
    );
  }
  const lootOwnerToGuild = await guildLootsMulti.execute();

  const votes = {};
  for (const [addressAndBagIndex, guild] of Object.entries(lootOwnerToGuild)) {
    if (String(guild) === String(options.guildId)) {
      const address = addressAndBagIndex.split('-')[0];
      votes[address] = address in votes ? votes[address] + 1 : 1;
    }
  }

  return Object.fromEntries(
    addresses.map((address: any) => [
      address,
      address in votes ? votes[address] : 0
    ])
  );
}
