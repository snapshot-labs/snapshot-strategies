# ERC20 Quadratic Voting Strategy

This strategy implements quadratic voting for ERC20 token holders. It applies the square root function to token balances, reducing the voting power of large holders while maintaining proportional representation for smaller holders.

## How it Works

The strategy calculates voting power using the formula:
```
votingPower = √(tokenBalance)
```

This means:
- A holder with 100 tokens gets √100 = 10 voting power
- A holder with 400 tokens gets √400 = 20 voting power  
- A holder with 900 tokens gets √900 = 30 voting power

## Parameters

- `address`: The ERC20 token contract address
- `symbol`: Token symbol (for display purposes)
- `decimals`: Number of token decimals

## Example Configuration

```json
{
  "strategies": [
    [
      "erc20-quadratic-voting",
      {
        "address": "0x6b175474e89094c44da98b954eedeac495271d0f",
        "symbol": "DAI",
        "decimals": 18
      }
    ]
  ]
}
```

## Benefits

1. **Decentralization**: Prevents large token holders from dominating governance
2. **Fairness**: Gives smaller holders meaningful voting power
3. **Simplicity**: Easy to understand and implement
4. **Compatibility**: Works with any ERC20 token

## Limitations

1. **Sybil Vulnerability**: Can be gamed by splitting tokens across multiple addresses
2. **Reduced Incentives**: May reduce incentives for large stakeholders
3. **Complexity**: More complex than simple token-weighted voting

## Comparison with Linear Voting

| Token Balance | Linear Voting Power | Quadratic Voting Power |
|---------------|-------------------|----------------------|
| 100 tokens    | 100               | 10                   |
| 400 tokens    | 400               | 20                   |
| 900 tokens    | 900               | 30                   |
| 1600 tokens   | 1600              | 40                   |

This shows how quadratic voting reduces the power gap between large and small holders. 