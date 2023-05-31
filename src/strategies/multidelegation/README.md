# multidelegation

If you want to delegate your voting power to multiple wallet addresses, you can do this using the “multidelegation strategy”. This strategy is based on [delegation strategy](https://github.com/snapshot-labs/snapshot-strategies/tree/master/src/strategies/delegation) with the exception that you can delegate to several addresses at the same time.

If A delegates to B and C, A's score is splitted equally to B and C. In case A already has a delegation made with the [delegation strategy](https://github.com/snapshot-labs/snapshot-strategies/tree/master/src/strategies/delegation), this “multidelegation strategy” overrides it.

The multidelegation smart contract is in Polygon, so the gas fee to delegate is way lower.

| Param Name      | Description |
| ----------- | ----------- |
| strategies      | list of sub strategies to calculate voting power based on delegation      |
| delegationSpace (optional)   | Get delegations of a particular space (by default it take delegations of current space)  |

Here is an example of parameters:

```json
{
  "symbol": "YFI (delegated)",
  "strategies": [
    {
      "name": "erc20-balance-of",
      "params": {
        "address": "0xBa37B002AbaFDd8E89a1995dA52740bbC013D992",
        "symbol": "YFI",
        "decimals": 18
      }
    },
    {
      "name": "yearn-vault",
      "params": {
        "address": "0xBA2E7Fed597fd0E3e70f5130BcDbbFE06bB94fe1",
        "symbol": "YFI (yYFI)",
        "decimals": 18
      }
    }
  ]
}

```