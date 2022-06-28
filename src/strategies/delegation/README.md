# delegation

If you want to delegate your voting power to another wallet address, you can do this using the “delegation strategy”. In delegation strategy, if A delegates to B and both of them vote, then the delegated voting power is not calculated. Only the vote of A will be calculated. The vote of B will be counted if A does not vote.

In delegation strategy, the sub strategies defined in params are used to delegate vote from one address to another.

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