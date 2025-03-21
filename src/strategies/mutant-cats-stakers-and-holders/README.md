# Mutant Cats stakers and holders strategy

This strategy return the balances of the voters for Mutant Cats project from both staking pool and ERC721 NFT.

## Accepted options

- **staking:** Mutant Cats staking pool address.

- **token:** Mutant Cats ERC721 NFT address.

## Examples

```JSON
[
  {
    "name": "Mutant Cats Stakers and Holders",
    "strategy": {
      "name": "mutant-cats-stakers-and-holders",
      "params": {
        "staking": "0xd09656a2EE7E5Ee3404fAce234e683D3337dA014",
        "token": "0xaAdBA140Ae5e4c8a9eF0Cc86EA3124b446e3E46A"
      }
    },
    "network": "1",
    "addresses": [
      "0xcb5C730A85795b20C1fdB543B64B2ED164333803",
      "0x4252a493899D1E2D1573Ff4084446C095C75055E"
    ],
    "snapshot": 13439719
  }
]
```
