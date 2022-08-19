# fight-club

This strategy calculates a fight-club member's voting score.

## Params

- `gloves` - (**Required**, `object`) Fight Club Glove NFT addresses and weights
- `weightClassAddress` - (**Required**, `string`) Weight Class Kudo (ERC-1155) Address
- `weightClassIds` - (**Required**, `object`) Weight Class Kudo IDs and weights
- `symbol` - (**Optional**, `string`) Symbol of the strategy


Here is an example of parameters:

```json
{
  "gloves": {
    "0x4BF0c7AD32Fd2d32089790a54485e23f5C7736C0": 8
  },
  "weightClassAddress": "0xB876baF8F69cD35fb96A17a599b070FBdD18A6a1",
  "weightClassIds": {
    "602": 4,
    "647": 5,
    "648": 6,
    "649": 7
  },
  "symbol": "FC"
}
```

## Details

This strategy uses a Multicall to query `balanceOf` fight club glove NFTs and
`balanceOf` weight class kudos (ERC-1155). A voter's score is calculated via the
following equation:

```
power = gloveWeight * weightClassMultiplier
```

* If a user has more than 1 fight club glove NFT, only the one with the highest
  associated weight is counted.
* If a user has more than 1 weight class Kudo, only the one with the highest
  associated weight is counted.
* If a user has 0 fight club glove NFTs, then their vote score is 0, regardless
  of their weight class Kudos.
* If a user has a fight club glove NFT, but 0 weight class Kudos, the weight
  class multiplier defaults to 1.

> **Warning**: This strategy uses `ethers.utils.BigNumber.toNumber()` and will
  fail if a voter's `gloveWeight` or `weightClassMultiplier` is is greater than or equal
  to `Number.MAX_SAFE_INTEGER` or less than or equal to `Number.MIN_SAFE_INTEGER`
