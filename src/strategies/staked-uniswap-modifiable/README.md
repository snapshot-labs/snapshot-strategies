# Staked Uniswap Modifiable

This stategy is a fork of the staked-uniswap strategy that allows users to customise the function to get the total staked amount of uniswap-lp tokens in the contract.

This strategy returns a score that is equivalent to the token amount provided in the uniswap liqudity pool
## Accepted options

- **tokenAddress:** Token Address

- **uniswapAddress:** Uniswap LP address

- **stakingAddress:** LP staking address

- **methodABI** ABI method to get total LP tokens staked in contract

- **symbol** Token of ERC-20

- **decimals** Decimals for ERC-20

## Examples

```JSON
[
 {
    "name": "Tokens staked in LP staking contract",
    "strategy": {
      "name": "staked-uniswap-modifiable",
      "params": {
        "tokenAddress": "0x2a2550e0a75acec6d811ae3930732f7f3ad67588",
        "uniswapAddress": "0x87051936dc0669460951d612fbbe93df88942229",
        "stakingAddress": "0xCF2026d955E6686B8582765BF0c5D2Ec05996796",
        "symbol": "PATH",
        "decimals": 18,
        "methodABI": {
          "name": "getTotalDeposit",
          "type": "function",
          "inputs": [
            {
              "name": "_account",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        }
      }
    }
 }
]
```