# thresholds

This strategy return the voting power based on the strategy passed with the thresholds.

| Parameter     | Description                                  |
| ------------- | ------------------------------------------   |
| `strategy`    | Strategy that you want to apply threshold to |
| `thresholds`  | threshold values, Refer to example below     |

Here is an example of parameters:

```json
{
  "strategy": {
    "name": "erc20-balance-of",
    "params": {
      "address": "0x6b175474e89094c44da98b954eedeac495271d0f",
      "decimals": 18
    }
  },
  "thresholds": [
    { "threshold": 1, "votes": 1 },
    { "threshold": 4, "votes": 2 },
    { "threshold": 11, "votes": 3 },
    { "threshold": 25, "votes": 4 }
  ]
}
```
