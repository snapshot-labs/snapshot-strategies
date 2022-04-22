# Stakers and holders strategy

This strategy return the balances of the voters from both staking pool and ERC721 NFT.

## Accepted options

- **staking:** Staking pool address.

- **token:** ERC721 NFT address.

## Examples

```JSON
[
  {
    "name": "Stakers and Holders",
    "strategy": {
      "name": "stakers-and-holders",
      "params": {
        "staking": "0x611D4fe3773606C7680020D1a59a2e8c5D43e682",
        "token": "0x79104Beca59CAe0EeeDd5ecB9fbc1AAD90cA40FE",
        "symbol": "HBC",
        "decimals": 0
      }
    },
    "network": "137",
    "addresses": [
      "0x5a0270Cf694a5b1e645dd5812f8d497B6bb87e07",
      "0x4C766160428cF0EE82b4dD677be90824A58E4855"
    ],
    "snapshot": 24178477
  }
]
```
