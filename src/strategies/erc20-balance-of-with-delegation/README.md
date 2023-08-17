# erc20-balance-of-with-delegation

Similar to `with-delegation` strategy, but it uses `erc20-balance-of` strategy to calculate voting power

## Params

| Param Name | Description |
| ---------- | ----------- |
| address    | The address of the token contract |
| symbol     | The symbol of the token |
| decimals   | The number of decimals of the token |
| delegationSpace (optional) | Get delegations of a particular space (by default it take delegations of current space) |
| delegationNetwork (optional) | Get delegations of a particular network (by default it take delegations of current network) |
