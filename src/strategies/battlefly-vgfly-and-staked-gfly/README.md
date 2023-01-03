# battlefly-vgfly-and-staked-gfly

This strategy calculates the voting power for addresses with one or more of the following requirements:

* An amount of unvested tokens
* An amount of staked tokens
* An amount of staked LP tokens

As input a graphUrl is required which will return those amounts for each queried address.

```json
{
  "address": "https://api.thegraph.com/subgraphs/name/battlefly-game/gfly-main",
  "symbol": "gFLY",
  "decimals": 18
}
```
