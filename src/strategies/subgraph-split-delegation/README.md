# subgraph-split-delegation

If you want to delegate your voting power to different addresses, you can use this strategy to calculate the voting power that will be delegated based on the Subgraph data.

```TEXT
Total VP = incoming delegated VP + own VP - outgoing delegated VP
```

The sub strategies defined in params are used to get the votint power that will be delegated based on the Subgraph data.

| Param Name      | Description |
| ----------- | ----------- |
| strategies      | list of sub strategies to calculate voting power based on delegation      |
| subgraphUrl   | The URL of the subgraph to query for the delegation data        |

Here is an example of parameters:

```json
{
  "subgraphUrl": "https://api.studio.thegraph.com/query/87073/split-delegation/v0.0.5",
  "strategies": [
    {
      "name": "erc20-balance-of",
      "params": {
        "address": "0xD01Db8Fb3CE7AeeBfB24317E12a0A854c256E99b",
        "symbol": "EPT",
        "decimals": 18
      }
    }
  ]
}

```
