# ERC721 with Metadata attribute

This strategy allows you to determine the voting power by reading the metadata attribute of holding NFT.

Generally `tokenURI(tokenID)` returns the individual metadata URI in ERC721.

But for performance requirement in snapshot, it needs single endpoint that returns all weight values at once, specifying in `metadataSrc`.

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
