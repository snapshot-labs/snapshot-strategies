# ChubbyKaijuDAO strategy

This strategy return the balances of the voters for ChubbyKaijuDAO project from both staking pool and ERC721 NFT.
Most of codes are from the "mutant-cats-stakers-and-holders" strategy.

## Accepted options

- **staking:** ChubbyKaijuDAO Gen1 staking V1 pool address.

- **token:** ChubbyKaijuDAO Gen1 ERC721 NFT address.

## Examples

```JSON
[
  {
    "name": "ChubbyKaijuDAO Stakers and Holders",
    "strategy": {
      "name": "chubbykaijudao-stakers-and-holders",
      "params": {
        "staking": "0x42299C513e442123D0903ca9e4A009dEE89Ae5de",
        "token": "0x65b28ED75c12D8ce29d892DE9f8304A6D2e176A7"
      }
    },
    "network": "1",
    "addresses": [ 
      "0xbA6f51199725D4f1F6B1A9E5fEFdc597eDC89B8A"
    ],
    "snapshot": 14129872
  }
]
```
