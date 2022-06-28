# meebitsdao-delegation

This delegation strategy returns the balances of the voters for specific ERC20 [mVOX](https://polygonscan.com/address/0x7C1a4c36D9BDa5C568f0E4877CD8E27D74Ae66c6) and ERC721 [MFND](https://polygonscan.com/address/0xc34cbca32e355636c7f52dd8beab0af2396ebd79). The calcualation is as follows: users with MFND tokens can hold voting power and can be assigned as delegates, while users with mVOX tokens can delegate votes (to those who hold MFND tokens) but cannot hold actual vote themselves. This is different from the standard Snapshot voting strategy in that votes from delegators do not count themselves, if the votes are not delegated.

Here is an example of parameters:

```json
{
  "symbol": "mVOX, MFND, Meebits",
  "tokenAddresses": [
    {
      "address": "0x7C1a4c36D9BDa5C568f0E4877CD8E27D74Ae66c6",
      "symbol": "mVOX",
      "decimals": 0,
      "network": "137"
    },
    {
      "address": "0xc34cbca32e355636c7f52dd8beab0af2396ebd79",
      "symbol": "MFND",
      "apiUrl": "https://api.meebitsdao.com/user/token_status/",
      "startingTokenId": 1,
      "endingTokenId": 200,
      "network": "137"
    },
    {
      "address": "0x7Bd29408f11D2bFC23c34f18275bBf23bB716Bc7",
      "symbol": "Meebits",
      "network": "1"
    }
  ]
}
```
