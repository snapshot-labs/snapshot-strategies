# samurailegends-generals-balance

A strategy that calculates the amount of general NFTs a user owns (NFT's with ids under 5000), which gives the voting power score.

Here is an example of parameters:

```json
{
  "batchAddress": "0x197352D6738011f2df1c3bB487a64aB075d1153A",
  "nftAddress": "0x14a3Ee3771845cee9EA2D49Fcca8DDA58f5D5D8b",
  "multiplier": 400,
  "treshold": 500
}
```

Parameter explanation:

- **batchAddress** The address of the batch balance contract
- **nftAddress** The address of the nft collection that should be fetched
- **multiplier** The voting multiplier to use
- **treshold** The treshold for which the NFTs should be counted (e.g. if 500, all under 500 are counted)
