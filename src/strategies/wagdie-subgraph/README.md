# WAGDIE Balance from Subgraph
### Modified from balance-of-subgraph

Calculates users balance of users WAGDIE in wallet and staked in the Forsaken Lands. 

```
accounts{
  id
  ownedWAGDIE
}
```


## Example

The space config will look like this:

```JSON
{
  // subgraphURL for the request
  "subGraphURL": "https://api.thegraph.com/subgraphs/name/wagdie/wagdieworld-mainnet",
  // scoreMultiplier can be used to increase users' scores by a certain magnitude
  "scoreMultiplier": 1,
  // location can be set to limit votes to WAGDIE staked in specific location. Use Location ID as string or "all" for all locations.
  "location": "all"
}
```
