# uniswap-v3-staking

This strategy counts the token balance of a staked Uniswap V3 position on the canonical [Uniswap V3 Staker contract](https://github.com/Uniswap/v3-staker). It also accounts for the unclaimed token rewards for an incentive program.

Here is an example of parameters:

```json
{
    "symbol": "RBN",
    "poolAddress": "0x94981f69f7483af3ae218cbfe65233cc3c60d93a",
    "tokenReserve": 0,
    "rewardToken": "0x6123B0049F904d730dB3C36a31167D9d4121fA6B",
    "startTime": 1633694400,
    "endTime": 1638878400,
    "refundee": "0xDAEada3d210D2f45874724BeEa03C7d4BBD41674"
}
```

The `poolAddress`, `rewardToken`, `startTime`, `endTime` and `refundee` comes from the [IncentiveKey](https://github.com/Uniswap/v3-staker/blob/main/contracts/interfaces/IUniswapV3Staker.sol) for a Staker Incentive program.

The `tokenReserve` refers to which side of the pair to count the token balance of. It must be either 0 or 1.
