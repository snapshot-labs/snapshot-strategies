# erc721-with-tokenid-list-weighted

This strategy is a modification of erc721-with-tokenid-range-weights-simple. This strategy takes token IDs instead of a range, and each list of token IDs is weighted. This is useful for ENS token IDs which can't be used with a range. 
This strategy allows for multiple votes from a single wallet. For example, a wallet containing three whitelisted ERC721 TokenIDs would receive three votes, weighted appropriately.

Here is an example of parameters:

```json
{
  "address": "0x30cDAc3871c41a63767247C8D1a2dE59f5714e78",
  "symbol": "Reaper(s)",
  "tokenIdWeightLists": [
    { "weight": 1, "ids": ["2112", "2151", "2871"] },
    { "weight": 10, "ids": ["3221", "3587", "4179"] }
  ]
}
```
