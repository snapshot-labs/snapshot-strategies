# multichain-supply-weighted

This is a fork of the multichain strategy by kesar. 

This strategy will calculate the balance of a multichain-token from various chains like Ethereum, Binance smart chain, polygon etc.

Exactly like the multichain strategy, the strategies array should define sub strategies which would use different networks mentioned in the field to combine the voting power.

In order to provide multichain functionality, this strategy provides a way to calculate which block number should be used on additional chains: If a snapshot was created on block 125 on mainnet, it will find the timestamp for that block and go find which block number corresponds to that same timestamp on every other wanted chain. This way it can accurately represent an address' voting power at a given point in time.

## Further more...

This strategy calls an external API to get the tokens total circulating/active supply. It also allows a weight to be defined as well. The supplyApi is where the GET request should be made to a REST API. you can use the supplyField to specify the field in the response data that contains the supply number you're looking for.

Using this information it will calculate the balance of a given token across all chains, divide it against the circulating supply to find the percentage of the circulating supply held by the address and then multiply it by the weight to get the final voting power.


Here is an example of parameters:

In the below example, the tokens on the three networks namely ethereum, polygon and bsc denotes combined voting power

```json
{
   "symbol": " MULTI",
        "supplyApi" : "https://circulating.giveth.io/token-supply",
        "supplyField" : "circulating",
        "weight" : 0.5,
        "strategies": [
          {
            "name": "erc20-balance-of",
            "network": "100",
            "params": {
              "address": "0x4f4F9b8D5B4d0Dc10506e5551B0513B61fD59e75",
              "decimals": 18
            }
          },
          {
            "name": "erc20-balance-of",
            "network": "100",
            "params": {
              "address": "0xfFBAbEb49be77E5254333d5fdfF72920B989425f",
              "decimals": 18
            }
          },
      {
            "name": "erc20-balance-of",
            "network": "10",
            "params": {
              "address": "0x528CDc92eAB044E1E39FE43B9514bfdAB4412B98",
              "decimals": 18
            }
          }
        ]
}

```
