# erc721-with-tokenid-range-weights-simple

This strategy is a modification of "erc721-with-tokenid-range-weights". This strategy allows for multiple votes from a single wallet, and different token ids represent different weights. For example, a wallet containing two ERC721 TokenIDs from weight 1, and three ERC721 TokenIDS from weight 4, would receive fourteen votes. (2*1+3*4). It's also possible to set up an optional "defaultWeight" for IDs that don't fall in any declared range. The other difference is that this strategy does not require the extension of OpenZeppelin's erc721Enumerable contract

Here is an example of parameters:

```json
{
  "address": "0x696115768bbef67be8bd408d760332a7efbee92d",
  "symbol": "LINKSDAO",
  "defaultWeight": 2,
  "tokenIdWeightRanges": [
    { "start": 1, "end": 100, "weight": 1 },
    { "start": 6364, "end": 6464, "weight": 4 }
  ]
}
```
