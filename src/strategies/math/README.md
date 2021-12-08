# math

Apply common mathematical operations on outputs from other strategies.

Currently supported operations are:

- `square-root`
- `cube-root`

The following example takes the cube root of a user's DAI token balance as voting score.

```json
{
  "symbol": "MATH",
  "strategy": {
    "name": "erc20-balance-of",
    "network": "1",
    "params": {
      "address": "0x6b175474e89094c44da98b954eedeac495271d0f",
      "symbol": "DAI",
      "decimals": 18
    }
  },
  "operation": "square-root"
}
```
