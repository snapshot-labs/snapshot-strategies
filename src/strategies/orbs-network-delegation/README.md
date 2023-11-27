# orbs-network-delegation

This strategy is based on the Orbs Delegation contract and its underlying logic.
It returns the net delegated ORBS stake in the requested network(chain) PoS, after accounting for delegators who vote for themselves.
A delegator who chooses to vote will override its delegate vote. The voter stake is counted once, either for a delegate or for a delegator.

Here is an example of parameters (Orbs Delegation contract on Ethereum Mainnet):

```json
{
  "address": "0xB97178870F39d4389210086E4BcaccACD715c71d",
  "symbol": "ORBS",
  "decimals": 18
}
```

This strategy can be combined with `multichain` for cross-chain Orbs PoS scores.
