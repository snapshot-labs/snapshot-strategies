# sd-gauge-less-vote-boost-crosschain

This strategy is used by Stake DAO to vote with sdToken using Time Weighted Averaged Voting Power (TWAVP) system and adapted for veSDT boost delegation with possibility to whiteliste address to by pass TWAVP.

```
VotingPower(user) = veToken.balanceOf(liquidLocker) * (average.sdTokenGauge.working_balances(user) / sdTokenGauge.working_supply)
```

>_sampleSize: in days_
>_sampleStep:  the number of block for `average` calculation (max 5)_

Here is an example of parameters:

```json
{
  "sdTokenGauge": "0xE2496134149e6CD3f3A577C2B08A6f54fC23e6e4",
  "symbol": "sdToken",
  "decimals": 18,
  "twavpDaysInterval": 10,
  "twavpNumberOfBlocks": 2,
  "whiteListedAddress": ["0x1c0D72a330F2768dAF718DEf8A19BAb019EEAd09", "0x931DaBf6721E47E6f5aeb19F6f5d48646144f484"],
  "blocksPerDay": 28798
}
```