# delegation-with-overrides

This strategy is based on the [delegation strategy](https://github.com/snapshot-labs/snapshot-strategies/tree/master/src/strategies/delegation), but with an optional `overrides` parameter: an address to address mapping, where the delegated voting power of each key will be forwarded to the corresponding value.

For example:

```json lines
{
  "overrides": {
    // The delegated votes of: 0xAD9992f3631028CEF19e6D6C31e822C5bc2442CC
    // will be forwarded to:   0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
    "0xAD9992f3631028CEF19e6D6C31e822C5bc2442CC": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
  }
}
```

| Param Name                 | Description                                                                              |
|----------------------------|------------------------------------------------------------------------------------------|
| strategies                 | list of sub strategies to calculate voting power based on delegation                     |
| delegationSpace (optional) | Get delegations of a particular space (by default it takes delegations of current space) |
| overrides (optional)       | Address mapping used to override delegated votes and forward to another address          |

Here is an example of parameters:

```json
{
  "symbol": "veBAL (delegated)",
  "strategies": [
    {
      "symbol": "veBAL (delegated)",
      "strategies": [
        {
          "name": "erc20-balance-of",
          "params": {
            "symbol": "veBAL",
            "address": "0xC128a9954e6c874eA3d62ce62B468bA073093F25",
            "decimals": 18
          }
        }
      ],
      "delegationSpace": "balancer.eth"
    }
  ],
  "delegationSpace": "balancer.eth",
  "overrides": {
    "0xAD9992f3631028CEF19e6D6C31e822C5bc2442CC": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
  }
}

```
