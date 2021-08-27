# Dfyn Liquidity Providers
This strategy has been forked from staked-uniswap strategy: https://github.com/snapshot-labs/snapshot-strategies/blob/master/src/strategies/staked-uniswap.

This strategy will return the scores of all users who have provided $DFYN token liquidity on Dfyn exchange. By changing token parameters, liquidity of other tokens can also be calculated. 

## Example

The space config will look like this:

```JSON
{
  "strategies": [
    ["dfyn-lp", {
      // token parameters
    "params": {
        "address": "0xc168e40227e4ebd8c1cae80f7a55a4f0e6d66c97",
        "symbol": "DFYN",
        "decimal": 18
      },
      // scoreMultiplier can be used to increase users' scores by a certain magnitude
      "scoreMultiplier": 1,
    }],
  ]
}
```