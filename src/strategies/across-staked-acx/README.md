# across-staked-acx

This strategy returns the voting power of an address that has staked any LP tokens in the [AcceleratingDistributor](https://etherscan.io/address/0x9040e41eF5E8b281535a96D9a48aCb8cfaBD9a48)
contract. The voting power is calculated as the amount of staked ACX-LP tokens multiplied by the current exchange
rate of ACX-LP to ACX. Finally, outstanding rewards for all staked LP positions denominated in ACX are then added to voting power.

## Params

- `acceleratingDistributorAddress` - (**Required**, `string`) Address of contract that emits ACX rewards for staked LP tokens.
- `acxLpTokenAddress` - (**Required**, `string`) Address of ACX-LP token.
- `wethLpTokenAddress` - (**Required**, `string`) Address of WETH-LP token.
- `usdcLpTokenAddress` - (**Required**, `string`) Address of USDC-LP token.
- `wbtcLpTokenAddress` - (**Required**, `string`) Address of WBTC-LP token.
- `daiLpTokenAddress` - (**Required**, `string`) Address of DAI-LP token.
- `hubPoolAddress` - (**Required**, `string`) Address of contract users can deposit tokens to receive LP tokens.
- `acxTokenAddress` - (**Required**, `string`) Address of token that is emitted to staked LP users in the AcceleratingDistributor.

Here is an example of parameters that work for `"network": "1"`

```json
{
    "acceleratingDistributorAddress": "0x9040e41eF5E8b281535a96D9a48aCb8cfaBD9a48",
    "acxLpTokenAddress": "0xb0C8fEf534223B891D4A430e49537143829c4817",
    "wethLpTokenAddress": "0x28F77208728B0A45cAb24c4868334581Fe86F95B",
    "usdcLpTokenAddress": "0xC9b09405959f63F72725828b5d449488b02be1cA",
    "wbtcLpTokenAddress": "0x59C1427c658E97a7d568541DaC780b2E5c8affb4",
    "daiLpTokenAddress": "0x4fabacac8c41466117d6a38f46d08ddd4948a0cb",
    "hubPoolAddress": "0xc186fa914353c44b2e33ebe05f21846f1048beda",
    "acxTokenAddress": "0x44108f0223A3C3028F5Fe7AEC7f9bb2E66beF82F"
}
```
