# Evolution Land Dao strategy
### why need this strategy
1. Because different NFTs belong to the same contract, different votes need to be given according to the type of NFT.
2. In order to get the NFT on the user's address, we need to iterate over all the NFTs on the address. This may result in a `execution reverted` error, so we use a paging query.
3. Since the Heco network public RPC is not available, we can obtain voting power for the chain from the specified `api-host`
4. We need this strategy to be multi-chain.

### how strategy count the voting power
`voting power = (land number * land_multiplier) + (apostle number * land_multiplier)`


Here is an example of parameters:
```json
[
  {
    "name": "Evolution Land Dao Governance strategy",
    "strategy": {
      "name": "evolution-land-dao",
      "params": {
        "symbol": "EvolutionLand",
        "row": 800,
        "strategies": [
          {
            "name": "erc721-balance-of",
            "network": "44",
            "api_host": "",
            "params": {
              "address": "0x6Ab81AF040fec3c13685ccFB26eC50C8aAB46445",
              "decimals": 18,
              "land_multiplier": 1,
              "apostle_multiplier": 1
            }
          },
          {
            "name": "erc721-balance-of",
            "network": "80001",
            "params": {
              "address": "0xCB41aA8585A1D9bC1E824478BA3594e34C5008e3",
              "decimals": 18,
              "land_multiplier": 1,
              "apostle_multiplier": 1
            }
          },
          {
            "name": "erc721-balance-of",
            "network": "256",
            "api_host": "api-host",
            "params": {
              "address": "",
              "decimals": 18,
              "land_multiplier": 1,
              "apostle_multiplier": 1
            }
          }
        ]
      }
    },
    "network": "3",
    "addresses": [
      "0x84f4e9b619f1f456b67369369418e428e7ceab3c",
      "0x7eef076bc5c57afd42ac3cbf3e29b13a7baf4cac",
      "0x735182c782cb8e7806f8903de7913e6880cbf82e",
      "0xe59261f6d4088bcd69985a3d369ff14cc54ef1e5",
      "0x6268c09fcdefd20c60daebe674d20567fe3bde0a",
      "0x5a91fe74ab3788ff58187acaf3fb0a039534428e",
      "0xF5fDddF7acFAac5bbEFB1Ca2C4DBC39d3Bb40bDa",
      "0xa8fe0c745dc5c96a07df8167c76bcc9f22936d86"
    ],
    "snapshot": 12208926
  }
]

```
