# erable_governance_v1

This strategy calculates the voting power of $ERA token holders. The voting power is based on both tokens held in the wallet and tokens staked in the staking contract, with the following rules:

1 token in wallet = 1 vote
1 token in staking = 2 votes

```json
{
  "address": "0xA8bF0B92BE0338794d2e3b180b9643A1f0eB2914",
  "stakingAddress": "0xA88729cD1482F4B9A2cF6A9E72E8CD0a26EC3122",
  "symbol": "ERA",
  "decimals": 18
}
```