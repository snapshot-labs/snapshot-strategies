# sd-boost-twavp

This strategy is used by StakeDAO to vote with sdToken with Time Weighted Averaged Voting Power system and veSDT voting boost.
_sampleSize is in days_
_sampleStep is the number of block for TWAVP_
_avgBlockTime is in seconds_
Here is an example of parameters:

```json
{
  "sdToken": "0xD1b5651E55D4CeeD36251c61c50C889B36F6abB5",
  "veToken": "0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2",
  "lockerToken": "0x52f541764E6e90eeBc5c21Ff570De0e2D63766B6",
  "gauge": "0x7f50786A0b15723D741727882ee99a0BF34e3466",
  "symbol": "sdToken",
  "decimals": 18,
  "sampleSize": 30,
  "sampleStep": 5,
  "avgBlockTime": 13.91
}
```
