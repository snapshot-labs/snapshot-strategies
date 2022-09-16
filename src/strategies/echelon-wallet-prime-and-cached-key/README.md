# echelon-wallet-prime-cached-key

This strategy looks at an ERC1155 caching (staking) contract and assigns a linearly decaying amount of voting power. The business context behind this is that each cached asset is eligible to claim a set amount of ERC20s over the same period; and thus can use those tokens to vote as well. 

For example, at block 0, the voting should have equivalent to 4000 units of voting power. A year later, they should have 0 units. 

As parameters, we pass in the base amount of voting power (e.g. 4000), starting block where there's no decay, and number of months until complete decay (e.g. 12).

At a high level, the strategy grabs the UNIX timestamp in seconds for starting block, current block, and project timestamp of final block. It then queries the contract for the amount of cached ERC1155s. A simple slope formula is then applied to calculate the decay rate; which is then applied to determine the voting power per asset at current block.

This strategy also makes use of the `erc20-balance-of` strategy. The erc20 balance is added to the equivalent value of the cached NFT.

The final value is square rooted.

Example of parameters:

```json
    "params": {
        "symbol": "PRIME VOTE",
        "address": "0xb23d80f5FefcDDaa212212F028021B41DEd428CF",
        "decimals": 18,
        "stakingAddress": "0x3399eff96D4b6Bae8a56F4852EB55736c9C2b041",
        "baseValue": 4000,
        "startingBlock": 15166749,
        "monthsToDecay": 12
      }
```

