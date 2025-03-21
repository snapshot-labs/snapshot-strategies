# staked-psp-balance

This is a strategy to get PSP balances staked in SPSP contracts.

It calls `SPSP.PSPBalance(address)` for each SPSP staking contract for each user address and sums up PSP balances by user address.
Here is an example of parameters:

```json
{
  "address": "0xcafe001067cdef266afb7eb5a286dcfd277f3de5",
  "symbol": "PSP",
  "decimals": 18,
  "SPSPs": [
    "0x55A68016910A7Bcb0ed63775437e04d2bB70D570",
    "0xea02DF45f56A690071022c45c95c46E7F61d3eAb",
    "0x6b1D394Ca67fDB9C90BBd26FE692DdA4F4f53ECD",
    "0x37b1E4590638A266591a9C11d6f945fe7A1adAA7",
    "0xC3359DbdD579A3538Ea49669002e8E8eeA191433"
  ]
}
```
