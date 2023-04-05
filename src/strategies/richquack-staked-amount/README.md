# richquack-staked-amount

This strategy returns voting power for RichQuack stakers.

The voting power is based on the amount of staked tokensbalance, rather than delegated voting power.

## Params

- `stakingAddress` - (**Required**, `string`) Address of RichQuack Staking contract

Here is an example of parameters:

```json
{
    "stakingAddress": "0x24E1FB7a781d255EdC40e80C89d9289dC61925F2",
}
```
