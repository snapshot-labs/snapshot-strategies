# Balance of subgraph

To calculate the token balance including user's EOA and smart wallet, we developed this strategy. Developers can create their own subparagraphs using the below scheme, and the score will be calculated as a result.

```
users{
  id
  amount
}
```


## Example

The space config will look like this:

```JSON
{
  // subgraphURL for the request
  "subGraphURL": "https://api.thegraph.com/subgraphs/name/dinngodev/furucombo-tokenomics-mainnet",
  // scoreMultiplier can be used to increase users' scores by a certain magnitude
  "scoreMultiplier": 1,
}
```
