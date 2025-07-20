/*
  Niji Warriors are NFTs that can vote on behalf of their owner. Each NFT has its own private key.

  At any time, Niji Warrior NFTs can vote on edenonline.eth Snapshot Proposals.
  The Niji Warrior's voting power equals 1 per default.

  When voting directly on Snapshot, the player's vote overrides the Niji Warrior's vote.
  The player's voting power is the square root of the sum of NFTs owned by the player.

  Strategy flow:
  - Retrieve the Niji Warriors address mapping (token ID to address) on IPFS
  - Makes a multicall for tokensOfOwner (use length for balance)

  If blockTag is provided, query the token balances for a specific block.
*/
import { multicall } from '../../utils';

const abi = [
  'function tokensOfOwner(address account) external view returns (uint256[])'
];

export const author = 'nicolas-law';
export const version = '0.1.0';
export const dependOnOtherAddress = true;

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const addressUrl = options.addressUrl;
  const votingWeight = options.votingWeight;
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // Fetch Niji Agent EOA addresses
  const req = await fetch(addressUrl);
  if (!req.ok) throw new Error('Failed to fetch Niji Warrior address mapping');
  const rawNijiData = await req.json();
  if (
    !rawNijiData.addresses ||
    !Array.isArray(rawNijiData.addresses) ||
    rawNijiData.addresses.length !== 10000 // 1 address per Niji Warrior
  ) {
    throw new Error(
      'Invalid Niji Warrior address mapping: missing or malformed `addresses` array'
    );
  }

  // Niji Warrior EOA address to tokenId
  const eoaToNijiId: Record<string, number> = {};
  rawNijiData.addresses.forEach((address: string, nijiId: number) => {
    eoaToNijiId[address] = nijiId;
  });

  const addressesSet = new Set<string>(addresses);

  // Filter out Niji Warrior EOAs since they own 0 tokens for tokensOfOwner multicall
  const standardVoters = Array.from(addressesSet).filter(
    (addr: string) => eoaToNijiId[addr] === undefined
  );

  // Fetch token IDs owned by each player
  const tokensOfOwner =
    standardVoters.length > 0
      ? await multicall(
          network,
          provider,
          abi,
          standardVoters.map((address: string) => [
            options.address,
            'tokensOfOwner',
            [address]
          ]),
          { blockTag }
        )
      : [];

  // Build tokenId => owner mapping for all NFTs owned by standard voter
  const tokenOwners: Record<number, string> = {};
  for (let idx = 0; idx < tokensOfOwner.length; idx++) {
    const tokens = tokensOfOwner[idx][0] || [];
    const owner = standardVoters[idx];
    for (let t = 0; t < tokens.length; t++) {
      tokenOwners[Number(tokens[t])] = owner;
    }
  }

  // Final results with overrides
  const results: Record<string, number> = {};
  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];
    if (eoaToNijiId[address] === undefined) {
      // Standard user: score = sqrt(NFT balance)
      const idx = standardVoters.indexOf(address);
      let tokenCount = 0;
      if (
        idx !== -1 &&
        tokensOfOwner[idx] &&
        Array.isArray(tokensOfOwner[idx][0])
      ) {
        tokenCount = tokensOfOwner[idx][0].length;
        results[address] = Math.sqrt(tokenCount);
      } else {
        results[address] = 0;
      }
    } else {
      // This is a Niji Warrior agent address, find its tokenId to find its owner
      // If the owner has already voted, agent gets 0; else `votingWeight`
      const nijiId = eoaToNijiId[address];
      const owner = tokenOwners[nijiId];
      results[address] = owner && addressesSet.has(owner) ? 0 : votingWeight;
    }
  }

  return results;
}
