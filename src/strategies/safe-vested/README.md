# safe-vested

Custom strategy to compute voting power from vested tokens. Originally created for the Safe allocations. Vesting smart contract code can be found [here](https://github.com/safe-global/safe-token/blob/81e0f3548033ca9916f38444f2e62e5f3bb2d3e1/contracts/VestingPool.sol).

## strategy parameters

The following parameters can be used to configure the strategy.

### allocationsSource

This parameter is mandatory. It expects a JSON using the following structure providing at least the example parameters.
```json
[
    [
        {
            "account": "ACCOUNT_ADDRESS",
            "contract": "ALLOCATIONS_CONTRACT",
            "vestingId": "VESTING_HASH",
            "amount": "VESTED_AMOUNT"
        }
    ]
]
```

### claimDateLimit

This is an optional parameter. A date limit to claim the vesting. Since that moment the vesting won't be considered unless the account already claimed some amount.

Needs to follow [ISO Date format](https://www.w3schools.com/js/js_date_formats.asp).
```js
"2022-12-04T11:00:00Z"
```

