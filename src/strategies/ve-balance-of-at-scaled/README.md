# ve-balance-of-at-scaled

This strategy returns the voting power of the voters for a ve-like token by calling `balanceOfAt` on the contract and then scales the result by a provided scale factor.

Here is an example of parameters:

```json
{
  "address": "0x1bffabc6dfcafb4177046db6686e3f135e8bc732",
  "symbol": "aveQI",
  "decimals": 18,
  "scaleValue": 1
}
```

The `scaleValue` parameter is used to scale the result of the `balanceOfAt` call. For example, if `scaleValue` is 1, the result is not scaled. If `scaleValue` is 0.01, the result is scaled down by a factor of 100.
