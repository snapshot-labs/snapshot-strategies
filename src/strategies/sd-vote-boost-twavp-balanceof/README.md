# sd-vote-boost-twavp-balanceof

This strategy is used by Stake DAO to vote with sdToken using Time Weighted Averaged Voting Power (TWAVP) system based on a balanceOf with possibility to whitelist addresses to by pass TWAVP.

>_sampleSize: in days_
>_sampleStep:  the number of block for `average` calculation (max 5)_
>_blockPerSec: the number of block per seconds of the destination chain

Here is an example of parameters:

```json
{
  "sdTokenGauge": "0xE2496134149e6CD3f3A577C2B08A6f54fC23e6e4",
  "symbol": "sdToken-gauge",
  "decimals": 18,
  "sampleSize": 10,
  "sampleStep": 5,
  "blockPerSec": 3,
  "whiteListedAddress": []
}
```