# holds-tokens

This strategy return the balances of the voters for a specific ERC20 or ERC721 and maps them to the number of votes that voter gets based on holding a set of tokens. on multiple networks

## Parameters

Same as [erc20-with-balance](https://snapshot.org/#/strategy/erc20-with-balance) strategy. except that we have to pass the `network` parameter. This is the network that the contract is deployed on. also can pass multiple params into `tokenAddresses` array (Check the example below).

> Note: minBalance is exclusive. For example if you pass `1`, balance should be more than `1`

Here is an example of parameters:

```json
{
 "tokenAddresses": [
  {
   "address": "0x7Bd29408f11D2bFC23c34f18275bBf23bB716Bc7",
   "network": "1",
   "decimals": 0,
   "minBalance": 1
  },
  {
   "address": "0xc34cbca32e355636c7f52dd8beab0af2396ebd79",
   "network": "137",
   "decimals": 0,
   "minBalance": 1
  }
 ]
}
```
