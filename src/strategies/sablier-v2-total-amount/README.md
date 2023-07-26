# sablier-v2-total-amount

This strategy returns the total amount deposited in streams for a given asset. The "voting power" will be assigned to recipients who own the streams at the given block.
If the addresses box is left empty, the query will check all recipients from the chosen chain.

Here is an example of parameters:

```json
{
  "address": "0x97cb342cf2f6ecf48c1285fb8668f5a4237bf862",
  "symbol": "DAI",
  "decimals": 18,
  "isGlobal": true
}
```
