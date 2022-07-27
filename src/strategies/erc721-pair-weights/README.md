# erc721

This strategy is used to determine the voting powers for a pair of ERC721 NFT registries. This strategy allows different weights for the registries and also for the number of pairs.

Here is an example of parameters:

```json
{
  "symbol": "OCMONK",
  "registries": [
    "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB",
    "0xb7F7F6C52F2e2fdb1963Eab30438024864c313F6"
  ],
  "weights": [
    4,
    6
  ],
  "pairWeight": 8
}
```
