# multichain

If you want to calculate the balance from various chains like Ethereum, Binance smart chain, polygon etc. and use them for voting using various strategies, you can do it by using a strategy called “multichain strategy”. This allows cross chain voting in which multiple chains can be used together to calculate the voting power.

In multichain strategy, the params should define sub strategies which would use different networks mentioned in the field to combine the voting power.

Here is an example of parameters:

In the below example, the tokens on the three networks namely ethereum, polygon and bsc denotes combined voting power.


```json
{
  "symbol": "MULTI",
  "strategies": [
    {
      "name": "erc20-balance-of",
      "network": "1",
      "params": {
        "address": "0x579cea1889991f68acc35ff5c3dd0621ff29b0c9",
        "decimals": 18
      }
    },
    {
      "name": "erc20-balance-of",
      "network": "137",
      "params": {
        "address": "0xB9638272aD6998708de56BBC0A290a1dE534a578",
        "decimals": 18
      }
    },
    {
      "name": "erc20-balance-of",
      "network": "56",
      "params": {
        "address": "0x0e37d70b51ffa2b98b4d34a5712c5291115464e3",
        "decimals": 18
      }
    },
    {
      "name": "erc20-balance-of",
      "network": 137,
      "params": {
        "address": "0xfC0fA725E8fB4D87c38EcE56e8852258219C64Ee",
        "decimals": 18
      }
    }
  ],
  "graphs": {
    "56": "https://api.thegraph.com/subgraphs/name/apyvision/block-info",
    "137": "https://api.thegraph.com/subgraphs/name/sameepsi/maticblocks"
  }
}

```
