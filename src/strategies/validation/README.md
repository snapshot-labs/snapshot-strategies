# validation strategy

Checks validity of users to vote with validationStrategies passed and if user is not valid it will return 0 as score. If user is valid it will return the voting power of the strategies passed into votingStrategies.

Parameters:

| Parameter               | Description                                      | Default value |
| -------------           | ------------------------------------------       | ------------- |
| `symbol`                | Token symbol                                     | optional      |
| `validationStrategies`  | List of strategies to check validation (Max 3)   |               |
| `votingStrategies`      | List of strategies to return voting power (Max 3)|               |
| `validationThreshold`   | Minimum voting power in a strategy               | 1             |

Example to return 1 voting power if user hold any USDC:

```json
{
    "symbol": "UNI",
    "validationStrategies": [{
        "name": "erc20-balance-of",
        "params": {
            "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            "decimals": 6
        }
    }],
    "validationThreshold": 1,
    "votingStrategies": [{
        "name": "ticket",
        "params": {}
    }]
}
```
