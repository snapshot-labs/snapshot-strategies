# sd-vote-boost

This strategy is used by StakeDAO to vote with sdToken adapted for veSDT boost delegation (without TWAVP).
```
VotingPower(user) = veToken.balanceOf(liquidLocker) * (sdTokenGauge.working_balances(user) / sdTokenGauge.working_supply)
```

Here is an example of parameters:

```json
{
  "veToken": "0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2",
  "liquidLocker": "0x52f541764E6e90eeBc5c21Ff570De0e2D63766B6",
  "sdTokenGauge": "0x7f50786A0b15723D741727882ee99a0BF34e3466",
  "symbol": "sdToken",
  "decimals": 18
}
```
