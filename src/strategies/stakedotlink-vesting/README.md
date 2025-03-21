# stakedotlink-vesting

Returns the vesting amount of tokens within a stake.link [DelegatorPool](https://github.com/stakedotlink/contracts/blob/main/contracts/core/DelegatorPool.sol).

To calculate the amount of vesting tokens, the strategy will perform `totalBalanceOf - balanceOf`, returning the amount 
tokens currently vesting at any given point in time.

- `totalBalanceOf`: Total balance of account including vesting tokens as per `VestingSchedule`
- `balanceOf`: Balance of account excluding vesting tokens as per `VestingSchedule`

Here is an example of parameters:

```json
{
  "address": "0xAEF186611EC96427d161107fFE14bba8aA1C2284",
  "symbol": "stSDL",
  "decimals": 18
}
```
