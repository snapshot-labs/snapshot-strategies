# solv-voucher-claimable

This strategy is to let owners of [Solv vesting vouchers](https://solv.finance/) vote with the voting power equal to their claimable token amount in the voucher at the time of the snapshot.

This can be combined with `erc20-balance-of` strategy to give the voting power of "amount held in wallet" + "amount available in the vesting voucher".

The parameters are the `address` of the vesting voucher contract and the `symbol` of the underlying token. Here is an example of parameters:

```json
{
  "address": "0x522f8fe415e08b600b8bd6c1db74a1b696845d0d",
  "symbol": "PDT"
}
```
