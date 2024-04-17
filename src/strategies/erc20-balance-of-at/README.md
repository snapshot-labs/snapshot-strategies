# erc20-balance-of-at

This strategy returns the balances of the voters for a specific ERC20 token at a specified snapshotID. The ERC20 token contract must implement ERC20 Snapshot (https://docs.openzeppelin.com/contracts/3.x/api/token/erc20#ERC20Snapshot)

Here is an example of parameters:

```json
{
  "address": "0xb4B486496469B3269c8907543706C377daAA4dD9",
  "symbol": "PYE",
  "decimals": 9,
  "snapshotId": 1
}
```
