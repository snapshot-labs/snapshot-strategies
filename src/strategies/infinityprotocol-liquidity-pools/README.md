# Liquidity Providers

This strategy will return the scores of all users who have provided token liquidity on any Uniswap style exchange. Users can change the subGraphURL field to direct their request to a different subgraph. 


## Example

The space config will look like this:

```JSON
{
  "strategies": [
    ["infinityprotocol-liquidity-pools", {
      // token parameters
    "params": {
        "address": "0xc168e40227e4ebd8c1cae80f7a55a4f0e6d66c97",
        "symbol": "DFYN"
        // subgraphURL for the request
        "subGraphURL": "https://api.thegraph.com/subgraphs/name/ss-sonic/dfyn-v5",
        // scoreMultiplier can be used to increase users' scores by a certain magnitude
        "scoreMultiplier": 1,
      },
    }],
  ]
}
```
