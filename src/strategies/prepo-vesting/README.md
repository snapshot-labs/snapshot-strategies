# prePO Vesting Snapshot Strategy

This strategy returns a voting score based on PPO under vesting from the [prePO Vesting contract](https://github.com/prepo-io/prepo-monorepo/apps/smart-contracts).

Score = unclaimed vested balance + unvested balance \* multiplier

To use this strategy, your contract must contain 3 methods from the prePO [Vesting interface](https://github.com/prepo-io/prepo-monorepo/blob/main/apps/smart-contracts/token/contracts/interfaces/IVesting.sol): `getAmountAllocated`, `getClaimableAmount` and `getVestedAmount`.

The strategy assumes that the vesting token has 18 decimals.

### Parameters

The strategy takes three parameters:
`symbol`: Symbol of token
`address`: Address of contract that has all the methods mentioned above
`multiplier`: A multiplier that is applied to unvested balance.

Here is an example of parameters:

```json
{
  "symbol": "PPO",
  "address": "0xB1B74EA823bAd9AFb5e2caC578235EeeB329A245",
  "multiplier": 0.5
}
```

### Tests

To test the strategy, run `yarn test --strategy=prepo-vesting --more=500`

### Links

- [prePO's Website](https://prepo.io/)
- [prePO's GitHub](https://github.com/prepo-io/prepo-monorepo/)
- [prePO's Snapshot Space](https://vote.prepo.io/#/)
