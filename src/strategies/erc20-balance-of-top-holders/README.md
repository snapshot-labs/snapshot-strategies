# erc20-balance-of-top-holders

Strategy, that accept votes only from top N token holders

Subgraph should be compatible with [OpenZeppelin ERC20 Subgraph](https://github.com/OpenZeppelin/openzeppelin-subgraphs)

Here is an example of parameters:

```json
{
  "address": "0x8494Aee22e0DB34daA1e8D6829d85710357be9F7",
  "symbol": "HANDZ",
  "decimals": 18,
  "subgraphUrl": "https://api.thegraph.com/subgraphs/name/kostyamospan/handz-token",
  "topHolders": 5
}
```
