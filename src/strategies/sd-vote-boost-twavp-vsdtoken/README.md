# sd-vote-boost-twavp-vsdtoken

This strategy is used by Stake DAO to vote with sdToken using Time Weighted Averaged Voting Power (TWAVP) system and adapted for veSDT boost delegation with possibility to whiteliste address to by pass TWAVP.

```
VotingPower(user) = veToken.balanceOf(liquidLocker) * (average.sdTokenGauge.working_balances(user) / sdTokenGauge.working_supply)
```

>_sampleSize: in days_
>_sampleStep:  the number of block for `average` calculation (max 5)_

Here is an example of parameters:

```json
{
  "veToken": "0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2",
  "liquidLocker": "0x52f541764E6e90eeBc5c21Ff570De0e2D63766B6",
  "sdTokenGauge": "0x7f50786A0b15723D741727882ee99a0BF34e3466",
  "sdToken": "0xD1b5651E55D4CeeD36251c61c50C889B36F6abB5",
  "pools": ["0xca0253a98d16e9c1e3614cafda19318ee69772d0"],
  "symbol": "sdToken",
  "decimals": 18,
  "sampleSize": 10,
  "sampleStep": 5,
  "botAddress": "",
  "whiteListedAddress": ["0x1c0D72a330F2768dAF718DEf8A19BAb019EEAd09"]
}
```