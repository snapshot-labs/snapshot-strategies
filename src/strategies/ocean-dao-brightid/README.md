# Ocean DAO BrightID Snapshot strategy

`version 0.1`

This strategy sums the scores of given multiple strategies for each voter. If the voter is verified on the BrightId registry contract, the score of the voter is multiplied by a factor of `brightIdMultiplier` parameter.

Example parameters:

```json
{
  "brightIdMultiplier": 5,
  "brightIdNetwork": "4",
  "registry": "0xbD45cf7C9f8eE04409C31D0ef939D4b0926263Ae",
  "symbol": "OCEAN",
  "brightIdNetwork":4,
  "brightIdSnapshot":100000,
  "strategies": [
    {
      "name": "erc20-balance-of",
      "params": {
        "symbol": "OCEAN",
        "address": "0x967da4048cD07aB37855c090aAF366e4ce1b9F48",
        "decimals": 18
      }
    },
    {
      "name": "ocean-marketplace",
      "params": {
        "symbol": "OCEAN",
        "address": "0x967da4048cD07aB37855c090aAF366e4ce1b9F48",
        "decimals": 18
      }
    },
    {
      "name": "sushiswap",
      "params": {
        "symbol": "OCEAN",
        "address": "0x967da4048cD07aB37855c090aAF366e4ce1b9F48",
        "decimals": 18
      }
    },
    {
      "name": "uniswap",
      "params": {
        "symbol": "OCEAN",
        "address": "0x967da4048cD07aB37855c090aAF366e4ce1b9F48",
        "decimals": 18
      }
    },
    {
      "name": "contract-call",
      "params": {
        "address": "0x9712Bb50DC6Efb8a3d7D12cEA500a50967d2d471",
        "args": [
          "%{address}",
          "0xCDfF066eDf8a770E9b6A7aE12F7CFD3DbA0011B5",
          "0x967da4048cD07aB37855c090aAF366e4ce1b9F48"
        ],
        "decimals": 18,
        "symbol": "OCEAN",
        "methodABI": {
          "inputs": [
            {
              "internalType": "address",
              "name": "provider",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "poolToken",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "reserveToken",
              "type": "address"
            }
          ],
          "name": "totalProviderAmount",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        }
      }
    }
  ]
}
```
