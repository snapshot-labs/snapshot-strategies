# meebitsdao-staking

This strategy return the balances of the voters for a specific ERC20 or ERC721 and maps them to the number of votes that voter gets based on holding a set of tokens.

Here is an example of parameters:

```json
{
  "tokenAddresses": [
    {
      "address": "0x7C1a4c36D9BDa5C568f0E4877CD8E27D74Ae66c6",
      "symbol": "mVOX",
      "decimals": 0
    },
    {
      "address": "0xc34cbca32e355636c7f52dd8beab0af2396ebd79",
      "symbol": "MFND",
      "apiUrl": "https://api.meebitsdao.com/user/token_status/",
      "startingTokenId": 1,
      "endingTokenId": 200
    }
  ]
}
```
