# erc20-votes-undelegated-balance

This strategy gives voting power based on token balance, but only to users who haven't delegated their voting power at all (including self-delegation).

## How it works

1. **Checks delegation status**: Calls `delegates()` to see who the user has delegated their voting power to
2. **Gets token balance**: Calls `balanceOf()` to get the token balance of each address
3. **Calculates voting power**:
   - If user has delegated to anyone (including themselves): voting power = 0
   - If user hasn't delegated at all (delegates() returns zero address): voting power = token balance

This ensures only users who haven't participated in the delegation system at all get voting power from their token balance.

## Parameters

- `address` - (**Required**, `string`) The address of the ERC-20 Votes token contract
- `decimals` - (*Optional*, `number`) The number of decimals for the token. Defaults to 18

## Examples

```json
{
  "symbol": "VOTE",
  "address": "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
  "decimals": 18
}
```

In this example:

- Alice has 100 tokens and hasn't delegated at all → gets 100 voting power
- Bob has 50 tokens and delegated to Charlie → gets 0 voting power  
- Charlie has 75 tokens and self-delegated → gets 0 voting power (because he has delegated, even to himself)
- Dave has 25 tokens and hasn't delegated at all → gets 25 voting power
