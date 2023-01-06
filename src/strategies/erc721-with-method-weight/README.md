# erc721-with-method-weight

This strategy is a modification of "erc721".
This strategy allows to configure which method should be used for getting weights.

Here is an example of parameters:

```json
 {
  "name": "Example query with method weight",
  "strategy": {
    "name": "erc721-with-method-weight",
    "params": {
      "address": "0xbb2e3b5cb7fd90e6b239d5a26a3508f8c779a79f",
      "methodName": "getPowerOf"
    }
  },
  "network": "5",
  "addresses": [
    "0xBC3C2C6e7BaAeB7C7EA2ad4B2Fa8681a91d47Ccd",
    "0xaD3197b735d76B50b8e15A78D30b0F945a8BD3E5",
    "0xb0462911f2d4B5993000C493F5C261Bd55303664"
  ],
  "snapshot": 8229099
}
```
