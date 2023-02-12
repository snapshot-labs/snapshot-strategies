# sybil-protection

This is the most common strategy, it returns the balances of the voters for a specific ERC20 token.

Here is an example of parameters:

```json
{
  "strategy": {
    "name": "erc20-balance-of",
    "params": {
      "address": "0xc944E90C64B2c07662A292be6244BDf05Cda44a7",
      "symbol": "GRT",
      "decimals": 18
    }
  },
  "sybil": {
    "poh": "0xC5E9dDebb09Cd64DfaCab4011A0D5cEDaf7c9BDb",
    "brightId": "v5"
  }
}
```
