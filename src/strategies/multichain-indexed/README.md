# multichain

This Strategy extends the `multichain` strategy but scales each voters balance by an index value returned by the `index` function of an `indexAddress`. The `indexAddress` network uses the top level `network` parameter

The contract located at the `indexAddress` parameter must have a function called `index` that returns a single
uint256 value, the result of which will be downscaled by the provided `indexDecimals` and multiplied by
each user's cross-chain balance to arrive at their voting power.

If you want to calculate the balance from various chains like Ethereum, Binance smart chain, polygon etc. and use them for voting using various strategies, you can do it by using a strategy called “multichain strategy”. This allows cross chain voting in which multiple chains can be used together to calculate the voting power.

In multichain strategy, the params should define sub strategies which would use different networks mentioned in the field to combine the voting power.

In order to provide multichain functionality, this strategy requires a way for calculating which block number should be used on additional chains: If a snapshot was created on block 125 on mainnet, it needs to find the timestamp for that block and go find which block number corresponds to that same timestamp on every other wanted chain. This way it can accurately represent an address' voting power at a given point in time. In order to do this, it supports 2 different mechanisms:

- [DEFAULT] Querying a block subgraph. If a working block info subgraph is found for that chain, it can be passed into the strategy's options in the "graphs" object. This will allow the strategy to query that subgraph for the given chain and fetch the block number from there. An example of a graphs object could be:

```json
 "graphs": {
    "56": "https://api.thegraph.com/subgraphs/name/apyvision/block-info",
    "137": "https://api.thegraph.com/subgraphs/name/sameepsi/maticblocks"
  }
```

- Integrating with a custom API (overrides subgraph option if present). TheGraph doesn't support every existing chains on their hosting services, therefor finding a subgraph for them can be challenging without launching and maintaining an independant graph-node. This option comes in as an alternative for developers who wish to integrate even on chains without a subgraph. In order to integrate an API must be created to fulfill the block fetching functionality on every chain that wants to be supported. A single HTTP receiving a timestamp should return the block number for every desired chain.
  The setting that should be set is `blockApi` and it should be an url pointing to an endpoint that:
  - Supports GET calls passing timestamp as a query parameter. (Ex: If blockApi is "https://myCustomApi.com/blocks", it should support a GET to https://myCustomApi.com/blocks?timestamp=xxxxxx)
  - Return a json object containing at least 1 key named "blocks" with a map from chainId to block number for _every chain_ desired. An example of a valid api response could be:

```json
{
  "timestamp": "1640185827",
  "blocks": {
    "25": 678246,
    "56": 13700191,
    "128": 11097265,
    "137": 22832200,
    "250": 25715540,
    "1285": 1141104,
    "42161": 4021906,
    "42220": 10521555,
    "43114": 8573779,
    "1666600000": 20812976
  }
}
```

Here is an example of parameters:

In the below example, the tokens on the three networks namely ethereum, polygon and bsc denotes combined voting power and block numbers on each chain are searched from a subgraph query.

```json
{
        "symbol": "gOHM",
        "strategies": [
          {
            "name": "erc20-balance-of",
            "network": "1",
            "params": {
              "address": "0x0ab87046fBb341D058F17CBC4c1133F25a20a52f",
              "decimals": 18
            }
          },
          {
            "name": "erc20-balance-of",
            "network": "42161",
            "params": {
              "address": "0x8D9bA570D6cb60C7e3e0F31343Efe75AB8E65FB1",
              "decimals": 18
            }
          },
          {
            "name": "erc20-balance-of",
            "network": "43114",
            "params": {
              "address": "0x321e7092a180bb43555132ec53aaa65a5bf84251",
              "decimals": 18
            }
          },
          {
            "name": "erc20-balance-of",
            "network": "137",
            "params": {
              "address": "0xd8cA34fd379d9ca3C6Ee3b3905678320F5b45195",
              "decimals": 18
            }
          },
          {
            "name": "erc20-balance-of",
            "network": "250",
            "params": {
              "address": "0x91fa20244fb509e8289ca630e5db3e9166233fdc",
              "decimals": 18
            }
          },
          {
            "name": "erc20-balance-of",
            "network": "10",
            "params": {
              "address": "0x0b5740c6b4a97f90eF2F0220651Cca420B868FfB",
              "decimals": 18
            }
          }
        ],
        "indexAddress": "0x0ab87046fBb341D058F17CBC4c1133F25a20a52f",
        "indexDecimals": 9
      }
    },
    "network": "1",
    "addresses": ["0x0ab87046fBb341D058F17CBC4c1133F25a20a52f"],
    "snapshot": 14452779
  }

```
