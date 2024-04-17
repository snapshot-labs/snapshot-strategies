# skale-delegation-weighted

This strategy allow SKL tokens holders to participate in vote, where the weight of the vote is an amount of delegated tokens.
Holder can delegate directly or with Escrow contract(provided by SKALE)

Required params in `example.json`:
 - addressSKL - address of SKL token
 - addressAllocator - address of Allocator contract
 - validatorPower - enable validator voting(will count as amount of delegated to this validator minus holders who delegated) -
optional param default is `true`
 - onlyValidator - enable only validator voting - optional param default is `false`

```json
{
  "addressSKL": "0x00c83aeCC790e8a4453e5dD3B0B4b3680501a7A7",
  "addressAllocator": "0xB575c158399227b6ef4Dcfb05AA3bCa30E12a7ba",
  "validatorPower": false,
  "onlyValidator": true
}
```
