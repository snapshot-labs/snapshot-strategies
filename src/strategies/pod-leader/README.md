# PodLeader pool balance

Calculates the balance of either a uniswap pair in a Yield Yak/Pod leader style farm, or the amount of each individual token in that LP which is deposited into the farm. For example, if an LP pair has 100 token1 and 200 token2, one can isolate token2 for snapshot votes. One can also give weights to each of these tokens when combined with other strategies.

## Accepted options:

- chefAddress: Masterchef contract address
- pid: Mastechef pool id (starting with zero)

- uniPairAddress: Address of a uniswap pair (or a sushi pair or any other with the same interface)
    - If the uniPairAddress option is provided, converts staked LP token balance to base token balance
    (based on the pair total supply and base token reserve)
    - If uniPairAddress is null or undefined, returns staked token balance of the pool

- tokenAddress: Address of a token for single token Pools.
    - if the uniPairAddress is provided the tokenAddress is ignored.

- weight: Integer multiplier of the result (for combining strategies with different weights, totally optional)
- weightDecimals: Integer value of number of decimal places to apply to the final result

- token0.address: Address of the uniPair token 0. If defined, the strategy will return the result for the token0.
                
- token0.weight: Integer multiplier of the result for token0
- token0.weightDecimals: Integer value of number of decimal places to apply to the result of token0

- token1.address: Address of the uniPair token 1. If defined, the strategy will return the result for the token1.
                
- token1.weight: Integer multiplier of the result for token1
- token1.weightDecimal: Integer value of number of decimal places to apply to the result of token1


- log: Boolean flag to enable or disable logging to the console (used for debugging purposes during development)



Check the examples.json file for how to use the options.
