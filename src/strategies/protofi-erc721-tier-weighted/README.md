# protofi-erc721-tier-weighted

This strategy returns the voting power of a wallet given by the sum of the NFT token owned, weighted by the tier of the NFT. Works specifically for Protofi NFTs.
With the parameter "countUsed" you decide if taking into account used NFTs as voting power.

Here is an example of parameters:

```json
{
  "address": "0x1aDB6f30561116B4283169DdD1Ca16ed2A34355A",
  "symbol": "PNFT",
  "tierToWeight": [10,20,30,40,50],
  "countUsed": true
}
```
