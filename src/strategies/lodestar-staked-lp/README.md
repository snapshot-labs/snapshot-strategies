# lodestar-staked-lp

Used for fetching the staked LP token balance in a single staking pool and calculating
associated voting power. Voting power per staked LP token is calculated in terms of a "token weight", or the amount of the voting token that comprises 1 LP token (total amount of voting token in LP pool * 2 / total supply of LP tokens). The address' balance of LP tokens is multiplied by token weight to yield total voting power from staked LP tokens.

Here is an example of parameters:

```json
{
  "stakingPoolAddresses": [
    "0x4Ce0C8C8944205C0A134ef37A772ceEE327B4c11"
  ],
  "tokenAddress": "0xF19547f9ED24aA66b03c3a552D181Ae334FBb8DB",
  "lpTokenAddress": "0xFB36f24872b9C57aa8264E1F9a235405C4D3fC36",
  "symbol": "LODE",
  "decimals": 18
}
```
