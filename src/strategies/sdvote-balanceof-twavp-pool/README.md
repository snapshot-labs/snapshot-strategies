# sdvote-balanceof-twavp-pool

This strategy is used by Stake DAO to vote with sdToken using Time Weighted Averaged Voting Power (TWAVP) system based on a balanceOf with possibility to whitelist addresses to by pass TWAVP.
Also, the voting power based on the balance of the specified pools is allocated to a bot

Here is an example of parameters:

```json
{
  "sdTokenGauge": "0xE2496134149e6CD3f3A577C2B08A6f54fC23e6e4",
  "symbol": "sdToken-gauge",
  "decimals": 18,
  "twavpDaysInterval": 10,
  "twavpNumberOfBlocks": 5,
  "blockPerSec": 3,
  "whiteListedAddress": [],
  "pools": [
    "0xb8204D31379A9B317CD61C833406C972F58ecCbC"
  ],
  "botAddress": "0xb4542526AfeE2FdA1D584213D1521272a398B42a",
  "indexSdTokenInPool": 1
}
```