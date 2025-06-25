# Overtime Strategy

A governance strategy designed for Overtime.
Voting power is determined by the $OVER token balance. If the address is a smart contract account, the voting power is assigned to their externally owned account (EOA) owner.

## Examples

Here is an example of parameters:

```JSON
{
  "address": "0xedf38688b27036816a50185caa430d5479e1c63e",
  "symbol": "OVER",
  "decimals": 18,
  "eoaToSmartAccountMapApi": "https://overdrop.overtime.io/eoa-smart-account-map"
}
```
