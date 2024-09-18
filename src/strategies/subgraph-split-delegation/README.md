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
      "name": "polygon-self-staked-pol",
      "params": {
        "stakeManagerAddress": "0x4AE8f648B1Ec892B6cc68C89cc088583964d08bE",
        "decimals": 18
      }
    }
  ]
}

```
