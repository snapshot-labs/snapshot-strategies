# math

Apply common mathematical operations on outputs from other strategies.

## Operations

Currently supported operations are:

| Operation     | Operand Count | Description                                |
| ------------- | ------------- | ------------------------------------------ |
| `square-root` | 1             | takes the square root of the operand       |
| `cube-root`   | 1             | takes the cube root of the operand         |
| `min`         | 2             | takes the smaller number of the 2 operands |
| `max`         | 2             | takes the larger number of the 2 operands  |

## Examples

The following example takes the cube root of a user's DAI token balance as voting score.

```json
{
  "symbol": "MATH",
  "operands": [
    {
      "type": "strategy",
      "strategy": {
        "name": "erc20-balance-of",
        "network": "1",
        "params": {
          "address": "0x6b175474e89094c44da98b954eedeac495271d0f",
          "symbol": "DAI",
          "decimals": 18
        }
      }
    }
  ],
  "operation": "square-root"
}
```

Here's another example that sets a maximum score of 100 for the result above.

```json
{
  "symbol": "MATH",
  "operands": [
    {
      "type": "strategy",
      "strategy": {
        "name": "math",
        "network": "1",
        "symbol": "MATH",
        "params": {
          "operands": [
            {
              "type": "strategy",
              "strategy": {
                "name": "erc20-balance-of",
                "network": "1",
                "params": {
                  "address": "0x6b175474e89094c44da98b954eedeac495271d0f",
                  "symbol": "DAI",
                  "decimals": 18
                }
              }
            }
          ],
          "operation": "square-root"
        }
      }
    },
    {
      "type": "constant",
      "value": 100
    }
  ],
  "operation": "min"
}
```
