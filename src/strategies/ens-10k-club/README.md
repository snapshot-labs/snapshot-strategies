# ens-10k-club

This strategy is for 10K Club members, holders of ENS names 000.eth - 9999.eth.
This script queries The Graph for all ENS names owned by voter and checks for 10K Club names.
By default, 999 Club members' votes are weighted 10x.

Here is an example of parameters:

```json
{
  "address": "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
  "symbol": "NUMS",
  "clubWeight10k": 1,
  "clubWeight999": 10
}
```
