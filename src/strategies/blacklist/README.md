# Blacklist strategy

## Description

This strategy executes a configured strategy and applies a blacklist to it's results effectively setting the result to 0 for any address set in the blacklist.

## Accepted options

- **strategy.name:** name of the strategy to run

- **strategy.params:** the strategy specific params to execute it.

- **blacklist:** An array of st6rings representing wallet addresses to be blacklisted an their result set to 0
  
## Examples

```json
[
  {
    "name": "blacklist",
    "strategy": {
      "name": "blacklist",
      "params": {
        "strategy": {
          "name": "erc20-balance-of",
           "params": {
            "address": "0x579cea1889991f68acc35ff5c3dd0621ff29b0c9",
            "decimals": 18
          }
        },
        "blacklist": [
          "0xaca39b187352d9805deced6e73a3d72abf86e7a0"
        ]
      }
    },
    "network": "1",
    "addresses": [
      "0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5",
      "0x9feab70f3c4a944b97b7565bac4991df5b7a69ff",
      "0xaca39b187352d9805deced6e73a3d72abf86e7a0"
    ],
    "snapshot": 12419836
  }
]
```
