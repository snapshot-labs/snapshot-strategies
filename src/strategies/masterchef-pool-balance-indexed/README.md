# masterchef-pool-balance-indexed

Extends the `masterchef-pool-balance` strategy to scale each voter's balance by an index value that increases over time.

This is particularly useful for Olympus-style protocols whose value is tied to an index.

`chefAddress` masterchef contract address
`pid` mastechef pool id (starting with zero)
`uniPairAddress` address of a uniswap pair (or a sushi pair or any other with the same interface)
-- if the uniPairAddress option is provided, converts staked LP token balance to base token balance (based on the pair total supply and base token reserve)
-- if uniPairAddress is null or undefined, returns staked token balance as is
`tokenIndex` index of a token in LP pair, optional, by default 0
`weight` integer multiplier of the result (for combining strategies with different weights, totally optional)

The contract located at the `indexAddress` parameter must have a function called `index` that returns a single
uint256 value, the result of which will be downscaled by the provided `decimals` and multiplied by each user's token balance to arrive at their voting power.

The index value may have a different number of decimals than the LP token, so configure this via the `indexDecimals` parameter.

Here is an example of parameters:

```json
      "params": {
        "symbol": "gOHM",
        "chefAddress": "0xF4d73326C13a4Fc5FD7A064217e12780e9Bd62c3",
        "uniPairAddress": "0xaa5bD49f2162ffdC15634c87A77AC67bD51C6a6D",
        "indexAddress": "0x0ab87046fBb341D058F17CBC4c1133F25a20a52f",
        "indexDecimals": 9,
        "tokenIndex": null,
        "pid": "12",
        "weight": 1,
        "weightDecimals": 0,
        "indexNetwork": "1"
      }
```
