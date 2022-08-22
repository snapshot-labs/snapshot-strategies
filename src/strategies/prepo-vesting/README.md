# prePO Vesting Snapshot Strategy

This strategy returns a voting score based on PPO under vesting from the [prePO Vesting contract](https://github.com/prepo-io/prepo-monorepo/blob/main/apps/smart-contracts/token/contracts/vesting/Vesting.sol).

To use this strategy, your contract must contain 3 methods from the prePO [Vesting interface](https://github.com/prepo-io/prepo-monorepo/blob/main/apps/smart-contracts/token/contracts/vesting/interfaces/IVesting.sol): `getAmountAllocated`, `getClaimableAmount` and `getVestedAmount`.

This strategy assumes that the vesting token has 18 decimals.

### Calculation

When contract is paused (as a proxy for a cliff):
`score = (unclaimedVestedBalance + unvestedBalance) * multiplier`

Else:
`score = unclaimedVestedBalance + unvestedBalance * multiplier`

where:

- `unclaimedVestedBalance = getClaimableAmount`
- `unvestedBalance = getAmountAllocated - getVestedAmount`

### Parameters

The strategy takes three parameters:

- `symbol`: Symbol of the strategy
- `address`: Address of contract that has all the methods mentioned above
- `multiplier`: A multiplier applied to the unvested balance

Here is an example of parameters:

```json
{
  "symbol": "PPO (Vesting)",
  "address": "0xB1B74EA823bAd9AFb5e2caC578235EeeB329A245",
  "multiplier": 0.5
}
```

### Tests

To test the strategy, run `yarn test --strategy=prepo-vesting --more=500`

### Links

- [prePO's Website](https://prepo.io/)
- [prePO's GitHub](https://github.com/prepo-io/prepo-monorepo/)
- [prePO's Snapshot Space](https://vote.prepo.io/)
