# ERC721 with Multiplier Landtype Strategy

This strategy returns the balances of the voters for a specific ERC721 NFT with an arbitrary multiplier based on the type of land they own.
Types Of Land :
Mega contributes 25000 VP 
Large contributes 10000 VP
Medium contributes 4000 VP
Unit contributes 2000 VP

## Parameters

- **address**: The address of the ERC721 contract.
- **multiplier**: The multiplier to be applied to the balance.
- **symbol**: The symbol of the ERC721 token.

Here is an example of parameters:

```json
{
  "address": "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB",
  "symbol": "LAND"
}
```
