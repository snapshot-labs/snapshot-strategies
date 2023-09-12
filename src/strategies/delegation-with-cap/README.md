# delegation-with-cap

This strategy is based on the [delegation](https://github.com/snapshot-labs/snapshot-strategies/tree/master/src/strategies/delegation) strategy, with an additional `capPercentage` parameter that caps the voting power of any address to a percentage of the total votes.

| Param Name                 | Description                                                                             |
|----------------------------|-----------------------------------------------------------------------------------------|
| strategies                 | list of sub strategies to calculate voting power based on delegation                    |
| capPercentage              | Maximum voting power for any address as a percentage of total votes                     |
| delegationSpace (optional) | Get delegations of a particular space (by default it take delegations of current space) |

Here is an example of parameters:

```json
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
  "delegationSpace": "balancer.eth",
  "capPercentage": 30
}

```
