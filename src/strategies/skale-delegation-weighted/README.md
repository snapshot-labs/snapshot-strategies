# skale-delegation-weighted

This strategy allow SKL tokens holders to participate in vote, where the weight of the vote is an amount of delegated tokens.
Holder can delegate directly or with Escrow contract(provided by SKALE)

Required params in `example.json`:
 - addressSKL - address of SKL token
 - addressAllocator - address of Allocator contract

```json
{
  "addressSKL": "0x6b175474e89094c44da98b954eedeac495271d0f",
  "symbol": "SKL",
  "decimals": 18
}
```
