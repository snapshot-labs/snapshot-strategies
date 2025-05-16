# eden-online-override

Niji Warriors are NFTs that can vote on behalf of their owner. Each NFT has its own private key.

At any time, Niji Warrior NFTs can vote on edenonline.eth Snapshot Proposals.
The Niji Warrior's voting power equals 1 per default.

When voting directly on Snapshot, the player's vote overrides the Niji Warrior's vote.
The player's voting power is the square root of the sum of NFTs owned by the player.

Strategy flow:

- Retrieve the Niji Warriors address mapping (token ID to address) on IPFS
- Makes a multicall for tokensOfOwner (use length for balance)

If blockTag is provided, query the token balances for a specific block.
