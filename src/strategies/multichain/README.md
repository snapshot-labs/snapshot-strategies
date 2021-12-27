# multichain

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
  - Return a json object containing at least 1 key named "blocks" with a map from chainId to block number for *every chain* desired. An example of a valid api response could be:
```json
     {
      "timestamp":"1640185827",
      "blocks":{
          "25":678246,
          "56":13700191,
          "128":11097265,
          "137":22832200,
          "250":25715540,
          "1285":1141104,
          "42161":4021906,
          "42220":10521555,
          "43114":8573779,
          "1666600000":20812976
      }
    }
```


Here is an example of parameters:

In the below example, the tokens on the three networks namely ethereum, polygon and bsc denotes combined voting power and block numbers on each chain are searched from a subgraph query.


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

In the below example, the custom API block fetching alternative is used. Note that the api url isn't a working one and should be replaced


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
  "blockApi": "https://api.custom/blocks"
}
```