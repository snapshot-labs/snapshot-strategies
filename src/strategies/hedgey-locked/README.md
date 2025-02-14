# hedgey-locked

This strategy calls the lockedBalances function on Hedgey Lockup and Vesting contracts

It can also apply a multiplier to the value returned

Here is an example of parameters:

```json
{
  "contracts": ["0xce7ac66e78aae01d899eb90b63d1f20be2e9c4b1", "0x24f4BC74C00412422C9D2A7c78033fc8Aea8Da18"],
  "token": "0xE13FB676E9bdd7AFda91495eC4e027FC63212FC3",
  "symbol": "TACO",
  "decimals": 18,
  "multiplier": 10
}
```
