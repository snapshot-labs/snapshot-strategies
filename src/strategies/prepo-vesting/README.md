# prepo-vesting

This strategy counts the token balance of an unvested prePO position on the [prePO Vesting contract](https://github.com/prepo-io/prepo-monorepo/). It also accounts for the vested unclaimed tokens.

Here is an example of parameters:

```json
{
  "address": "0xB1B74EA823bAd9AFb5e2caC578235EeeB329A245",
  "decimals": 18,
  "multiplier": 0.5
}
```

The `getAmountAllocated`, `getClaimableAmount` and `getVestedAmount` comes from the [Vesting interface](https://github.com/prepo-io/prepo-monorepo/blob/main/apps/smart-contracts/token/contracts/interfaces/IVesting.sol).
