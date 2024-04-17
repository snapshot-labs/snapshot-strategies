# math

Apply common mathematical operations on outputs from other strategies.

## Operations

Currently supported operations are:

| Operation     | Operand Count | Description                                |
| ------------- | ------------- | ------------------------------------------ |
| `square-root` | 1             | takes the square root of the operand       |
| `cube-root`   | 1             | takes the cube root of the operand         |
| `multiply`    | 2             | x * a                                      |
| `min`         | 2             | takes the smaller number of the 2 operands |
| `max`         | 2             | takes the larger number of the 2 operands  |
| `a-if-lt-b`   | 3             | (x, a, b) = x < b ? a : x                  |
| `a-if-lte-b`  | 3             | (x, a, b) = x <= b ? a : x                 |
| `a-if-gt-b`   | 3             | (x, a, b) = x > b ? a : x                  |
| `a-if-gte-b`  | 3             | (x, a, b) = x >= b ? a : x                 |
| `minus`       | 2             | x - a                                      |
| `divide`      | 2             | x / a                                      |

## Examples

The following example takes the square root of a user's DAI token balance as voting score.

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

Here's another example that sets any score from the result above that's less than 100 to zero.

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
      "value": 0
    },
    {
      "type": "constant",
      "value": 100
    }
  ],
  "operation": "a-if-lt-b"
}
```
