# erc721-with-method-weight

This strategy is a modification of "erc721". This strategy allows for multiple votes from a single wallet, and different token ids represent different weights. For example, a wallet containing two ERC721 TokenIDs from weight 1, and three ERC721 TokenIDS from weight 4, would receive fourteen votes. (2 * 1 + 3 * 4). The other difference is that this strategy does not require the extension of OpenZeppelin's erc721Enumerable contract.

Here is an example of parameters:

```json
 {
  "name": "Example query with method weight",
  "strategy": {
    "name": "erc721-with-method-weight",
    "params": {
      "address": "0xbb2e3b5cb7fd90e6b239d5a26a3508f8c779a79f",
      "methodName": "ownerTokensByLevel",
      "levelsWeight": {
        "1": 1,
        "2": 10,
        "3": 100,
        "4": 500,
        "5": 1000
      }
    }
  },
  "network": "5",
  "addresses": [
    "0xBC3C2C6e7BaAeB7C7EA2ad4B2Fa8681a91d47Ccd",
    "0xaD3197b735d76B50b8e15A78D30b0F945a8BD3E5"
  ],
  "snapshot": "latest"
}
```
