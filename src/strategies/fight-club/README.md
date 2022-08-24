# fight-club

This strategy calculates a fight-club member's voting score.

## Params

- `gloveAddresses` - (**Required**, `object`) Up to 10 Fight Club Glove NFT
  addresses and weights
- `weightClassAddress` - (**Required**, `string`) Weight Class Kudo (ERC-1155)
  Address
- `weightClassIds` - (**Required**, `object`) Up to 10 Weight Class Kudo IDs and
  weights
- `symbol` - (**Optional**, `string`) Symbol of the strategy


Here is an example of parameters:

```json
{
  "gloveAddresses": {
    "0x25ed58c027921E14D86380eA2646E3a1B5C55A8b": 3
  },
  "weightClassAddress": "0xF1F3ca6268f330fDa08418db12171c3173eE39C9",
  "weightClassIds": {
    "8": 4,
    "26": 5,
    "33": 6
  },
  "symbol": "FC"
}
```

## Details

This strategy uses a Multicall to query `balanceOf` fight club glove NFTs and
`balanceOf` weight class kudos (ERC-1155). A voter's score is calculated via the
following equation:

```
score = gloveWeight * weightClassMultiplier
```

* If a user has more than 1 fight club glove NFT, only the one with the highest
  associated weight is counted.
* If a user has more than 1 weight class Kudo, only the one with the highest
  associated weight is counted.
* If a user has 0 fight club glove NFTs, then their vote score is 0, regardless
  of their weight class Kudos.
* If a user has a fight club glove NFT, but 0 weight class Kudos, the weight
  class multiplier defaults to 1.
* To avoid memory issues, the strategy is limited to 10 distinct glove NFT
  addresses and 10 distinct weight class kudo IDs.

> **Warning**: This strategy uses `ethers.utils.BigNumber.toNumber()` and will
  fail if a voter's `gloveWeight` or `weightClassMultiplier` is is greater than
  or equal to `Number.MAX_SAFE_INTEGER` or less than or equal to
  `Number.MIN_SAFE_INTEGER`
