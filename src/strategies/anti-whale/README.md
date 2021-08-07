# Anti-Whale strategy

## Description

This strategy executes a configured strategy and applies an anti-whale measure to its results to reduce the impact of big wallets in the the resulting value, reducing the effect on the voting power as the token amount increases.

It will apply the the following to the result:
  
  ```none
  If result > antiWhale.threshold
    result = antiWhale.inflectionPoint * ( result / antiWhale.inflectionPoint ) ^ antiWhale.exponent

  If result <= antiWhale.threshold {
    thresholdMultiplier = ( antiWhale.inflectionPoint * ( antiWhale.threshold / antiWhale.inflectionPoint )^antiWhale.exponent ) / antiWhale.threshold

    result = result * thresholdMultiplier
  }
  ```

## Accepted options

- **strategy.name:** name of the strategy to run

- **strategy.params:** the strategy specific params to execute it.
  
- **log:** Boolean flag to enable or disable logging to the console (used for debugging purposes during development)

- **thresholdMultiplier:** The multiplier at which all results below threshold are multiplied. This is ratio of antiWhale/result at the threshold point.

- **antiWhale.threshold:** Point at which antiWhale effect no longer applies. Results less than this will be treated with a static multiplier. This is to reduce infinite incentive for multiple wallet exploits.
  - default: 1625.

  - lower cap: > 0 - set to default if <= 0.

- **antiWhale.inflectionPoint:** Point at which output matches result. Results less than this increase output. Results greater than this decrease output.
  - default: 6500.

  - lower cap: > 0 - set to default if <= 0.

  - must be >= antiWhale.threshold. Otherwise will be same as antiWhale.threshold.

- **antiWhale.exponent:** The exponent is responsible for the antiWhale effect. Must be less than one, or else it will have a pro-whale effect. Must be greater than zero, or else it will cause total voting power to trend to zero.
  - default: 0.5.

  - upper cap: 1.

  - lower cap: > 0 - set to default if <= 0.
  
## Examples

```json
[
  {
    "name": "anti-whale",
    "strategy": {
      "name": "anti-whale",
      "params": {
        "strategy": {
          "name": "erc20-balance-of",
          "network": "1",
          "params": {
            "address": "0x579cea1889991f68acc35ff5c3dd0621ff29b0c9",
            "decimals": 18
          }
        },
        "antiWhale": {
          "inflectionPoint": 1000,
          "threshold": 250,
          "exponent": 0.5
        },
        "log": true
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
