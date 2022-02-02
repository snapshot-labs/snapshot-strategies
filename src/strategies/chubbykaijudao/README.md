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
    "name": "Mutant Cats Stakers and Holders",
    "strategy": {
      "name": "mutant-cats-stakers-and-holders",
      "params": {
        "staking": "0x42299C513e442123D0903ca9e4A009dEE89Ae5de",
        "token": "0x65b28ED75c12D8ce29d892DE9f8304A6D2e176A7"
      }
    },
    "network": "1", // what is the network parameter?
    "addresses": [ // what is the addresses parameter - especially, what is the positive score?
      "0xcb5C730A85795b20C1fdB543B64B2ED164333803",
      "0x4252a493899D1E2D1573Ff4084446C095C75055E"
    ],
    "snapshot": 13439719 // what is the snapshot?
  }
]
```
