# DefiPlaza

This new strategy looks at `balanceOf` and the `quoteRewards` function of the DFP2 governance contract to be able to use the balance of unclaimed staking rewards in the voting process, next to the balance of DFP2 in a wallet.

It also looks at the `stakerData` function of the new StablePlaza pool contract (if given as an option) to be able to use the staked DFP2 tokens in the voting process.

The addresses in the `examples.json` are the current biggest DFP2 holders to create a real-world test scenario.

This strategy is based on the `erc20-balance-of` strategy.

Here is an example of the parameters:

```json
{
  "address": "0x2F57430a6ceDA85a67121757785877b4a71b8E6D",
  "stableplaza": "0x3A2b8cC91aF8bf45F3Ec61E779ee1c2ba6b7E694",
  "symbol": "DFP2",
  "decimals": 18
}
```
