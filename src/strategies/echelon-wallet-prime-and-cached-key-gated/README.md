# echelon-wallet-prime-cached-key-gated

This strategy looks at an ERC1155 caching (staking) contract and assigns a linearly decaying amount of voting power. The business context behind this is that each cached asset is eligible to claim a set amount of ERC20s over the same period; and thus can use those tokens to vote as well. 

For example, at block 0, the voting should have equivalent to 4000 units of voting power. A year later, they should have 0 units. 

As parameters, we pass in the base amount of voting power (e.g. 4000), starting block where there's no decay, and number of months until complete decay (e.g. 12).

At a high level, the strategy grabs the UNIX timestamp in seconds for starting block, current block, and project timestamp of final block. It then queries the contract for the amount of cached ERC1155s. A simple slope formula is then applied to calculate the decay rate; which is then applied to determine the voting power per asset at current block.

This strategy also makes use of the `erc20-balance-of` strategy. The erc20 balance is added to the equivalent value of the cached NFT.

The weighted voting power is square rooted.

In order to be eligible to vote, the address has to have a non-zero wallet erc1155 balance (using the `erc1155-all-balances-of` strategy) or be whitelisted. Additionally, the address cannot be blacklisted.

Example of parameters:

```json
    "params": {
        "symbol": "PRIME VOTE",
        "address": "0xb23d80f5FefcDDaa212212F028021B41DEd428CF",
        "decimals": 18,
        "stakingAddress": "0x3399eff96D4b6Bae8a56F4852EB55736c9C2b041",
        "baseValue": 4000,
        "startingBlock": 15166749,
        "monthsToDecay": 12,
        "erc1155Address": "0x76BE3b62873462d2142405439777e971754E8E77",
        "whitelist": [
          "0x1F717Ce8ff07597ee7c408b5623dF40AaAf1787C",
          "0xFCfcC87E312f323768f9553255250A9357a04109"
        ],
        "blacklist": ["0xE6be99cbC7796F90baff870a2ffE838a540E27C9"]
      }
```

