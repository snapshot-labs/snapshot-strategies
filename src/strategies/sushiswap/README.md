# Sushiswap

This strategy returns balances of the underlying token in Sushiswap LP pools

Here is an example of parameters:

```json
{
  "address": "0x0Ae055097C6d159879521C384F1D2123D1f195e6",
  "useStakedBalances": "true"
}
```

- *address* - the underlying token
- *useStakedBalances* - if **true** it will also return the token balances from the MasterChef LP Staking Pool
