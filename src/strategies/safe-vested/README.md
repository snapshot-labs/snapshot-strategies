# safe-vested

Custom strategy to compute voting power from vested tokens. Strategy is configurable accepting a JSON using the following structure.
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

