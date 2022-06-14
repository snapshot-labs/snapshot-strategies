# ERC721 with Metadata attribute - Vote power calculated via ownerOf

This strategy allows you to determine the voting power by reading the metadata attribute of holding NFT.

Generally `tokenURI(tokenID)` returns the individual metadata URI in ERC721.

But for performance requirement in snapshot, it needs single endpoint that returns all weight values at once, specifying in `metadataSrc`.

This strategy is a modification of "erc721-with-metadata". This strategy allows for multiple votes from a single wallet, and different token ids represent different weights. For example, a wallet containing two ERC721 TokenIDs from weight 1, and three ERC721 TokenIDS from weight 4, would receive fourteen votes. (2*1+3*4). The main difference is that this strategy does not require the extension of OpenZeppelin's erc721Enumerable contract, as implemented in "erc721-with-tokenid-range-weights-simple".

Here is an example of parameters:
```json
{
  "address": "0xedCbF9D4CC3BA9aAA896adADeac1b6DF6326f7D8",
  "symbol": "KAP-NFT",
  "metadataSrc": "https://6242dbddb6734894c157cfc0.mockapi.io/api/votingWeights"
}
```

And this is the required json schema for NFT metadata source.
```json
[
    {
        [tokenID]: [value]
    }
]
```

Example: 
(https://6242dbddb6734894c157cfc0.mockapi.io/api/votingWeights)
```json
[
  {
    "1": 5
  },
  {
    "2": 18
  },
  {
    "3": 1
  },
  {
    "4": 4
  },
  {
    "5": 11
  },
  {
    "6": 8
  },
  {
    "7": 7
  }
]
```
