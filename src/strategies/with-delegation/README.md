# with-delegation

If you want to delegate your voting power to another wallet address,
Unlike `delegation` strategy, delegator can't take back their voting power from the delegatee. and also delegate's voting power is added up. so no need to have an additional strategy

```TEXT
Total VP = delegated VP + own VP (if not delegated to anyone)
```

The sub strategies defined in params are used to delegate vote from one address to another. 

> Important Note: Don't pass strategies that need override

| Param Name      | Description |
| ----------- | ----------- |
| strategies      | list of sub strategies to calculate voting power based on delegation      |
| delegationSpace (optional)   | Get delegations of a particular space (by default it take delegations of current space)  |
| delegationNetwork (optional)   | Get delegations of a particular network (by default it take delegations of current network)  |

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
