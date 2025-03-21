# staking-amount-duration-exponential

This is a strategy for calculating voting power with this formula

Voting Power = Stake Amount × (1 + r) ^ Stake Duration

Here is an example of parameters:

```json
{
  "address": "0x6b175474e89094c44da98b954eedeac495271d0f",
  "symbol": "DAI",
  "decimals": 18,
  "rate": 0.1
}
```
