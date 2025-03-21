# WAGDIE Balance from Subgraph
### Modified from balance-of-subgraph

Calculates users balance of users WAGDIE in wallet and staked in the Forsaken Lands. 

```
characters{
  id
  owner {id}
  location {id}
}
```


## Example

The space config will look like this:

```JSON
{
  // subgraphURL for the request
  "subGraphURL": "https://subgrapher.snapshot.org/subgraph/arbitrum/CiuchCqNbcNs88KkbQqs7PwuaD2DrPqHqxuDVKrJ5ESM",
  // scoreMultiplier can be used to increase users' scores by a certain magnitude
  "scoreMultiplier": 1,
  // Array of location IDs to limit votes to specific locations. Can be set to ["all"] to include all locations. 
  "location": ["1", "2"]
}
```
