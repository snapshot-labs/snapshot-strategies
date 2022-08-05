# prePO Vesting Snapshot Strategy

This strategy counts the token balance of an unvested prePO position on the [prePO Vesting contract](https://github.com/prepo-io/prepo-monorepo/apps/smart-contracts). It also accounts for the vested unclaimed tokens.

To use this strategy, you contract must contain 3 methods, `getAmountAllocated`, `getClaimableAmount` and `getVestedAmount`, which comes from the [Vesting interface](https://github.com/prepo-io/prepo-monorepo/blob/main/apps/smart-contracts/token/contracts/interfaces/IVesting.sol).

### Parameters

The strategy takes three parameters:
`symbol`: Symbol of token
`address`: Address of contract that has all the methods mentioned above
`multipler`: A multiplier that is applied to unvested balance.

Here is an example of parameters:

```json
{
  "symbol": "PPO",
  "address": "0xB1B74EA823bAd9AFb5e2caC578235EeeB329A245",
  "multiplier": 0.5
}
```

### Links

- [prePO's Website](https://prepo.io/)
- [prePO's Github](https://github.com/prepo-io/prepo-monorepo/)
- [prePO's Snapshot Space](https://vote.prepo.io/#/)
