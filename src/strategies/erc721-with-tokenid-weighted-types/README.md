# erc721-with-tokenid-weighted-types

This strategy is a modification of erc721-with-tokenid-weighted. This strategy allows for multiple votes from a single wallet, and different token id's represent different weights. For example, a wallet containing primary ERC721 TokenIDs and three secondary ERC721 TokenIDS would receive fifteen votes.

Here is an example of parameters:

```json
{
  "address": "0x696115768bbef67be8bd408d760332a7efbee92d",
  "symbol": "LINKSDAO",
  "tokenIdsPrimary": ["1", ......, "6363"],
  "tokenIdsSecondary": ["6464", ......, "9090"],
  "primaryWeight": 1,
  "secondaryWeight": 4
}
```
