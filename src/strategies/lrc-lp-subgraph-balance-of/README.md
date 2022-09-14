# lrc-l2-subgraph-balance-of

Strategy to read account LRC LP balance from LoopringV2 subgraph.

Here is an example of parameters:

```json
{
  "symbol": "LRC",
  "tokenIdToPoolMap": {
    "235": "0x194db39e4c99f6c8dd81b4647465f7599f3c215a",
    "102": "0xe6cc0d45c4e4f81be340f4d176e6ce0d63ad5743",
    "83": "0x18920d6e6fb7ebe057a4dd9260d6d95845c95036",
    "168": "0xfa6680779dc9168600bcdcaff28b41c8fa568d98",
    "200": "0xc8f242b2ac6069ebdc876ba0ef42efbf03c5ba4b"
  },
  "graph": "https://api.thegraph.com/subgraphs/name/juanmardefago/loopring36"
}
```
