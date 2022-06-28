# Liquidity Providers


Fork from infinityprotocol-liquidity-pools. Fix there is some protocol can't query `users` issue.

This strategy will return the scores of all users who have provided token liquidity on any Uniswap style exchange. Users can change the subGraphURL field to direct their request to a different subgraph.


## Example

The space config will look like this:

```JSON
{
  "address": "0xffffffff2ba8f66d4e51811c5190992176930278",
  "symbol": "COMBO"
  // subgraphURL for the request
  "subGraphURL": "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2",
  // scoreMultiplier can be used to increase users' scores by a certain magnitude
  "scoreMultiplier": 1,
}
```
