# erc20-balance-of-indexed

Extends the `erc20-balance-of` strategy to scale each voter's balance by an index value that increases over time.

This is particularly useful for Olympus-style protocols that have a wrapped staked token whose value is
tied to an index.

The contract located at the `indexAddress` parameter must have a function called `index` that returns a single
uint256 value, the result of which will be downscaled by the provided `decimals` and multiplied by
each user's token balance to arrive at their voting power.

The index value may have a different number of decimals than the wrapped staked token, so configured this
via the `indexDecimals` parameter.

Here is an example of parameters:

{
  "symbol": "wsKLIMA",
  "address": "0x6f370dba99E32A3cAD959b341120DB3C9E280bA6",
  "indexAddress": "0x25d28a24Ceb6F81015bB0b2007D795ACAc411b4d",
  "decimals": 18,
  "indexDecimals": 9
}
