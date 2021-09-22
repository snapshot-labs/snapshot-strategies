# POAP (erc721) tokenid with weight

Each POAP is implemented as an erc721 with a max supply tokens.

This strategy weights the vote with a specific ERC721 NFT with a given TokenId according to the holdings of each POAP and relative scarcity of each NFT.

Here is an example of parameters:

```json
{
  "symbol": "POAP",
  "tokenIds": [
    {"id":"100001", "weight": 100}, 
    {"id":"100002", "weight": 10}, 
    {"id":"1000", "weight": 1}
  ]
}
```
