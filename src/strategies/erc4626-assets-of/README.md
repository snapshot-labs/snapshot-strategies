# erc4626-assets-of

Returns the quantity of assets held within a ERC4626 vault by a specific address.

ERC4626 has a `balanceOf` function that returns the number of "shares" owned by an address. This strategy converts the number of shares to the number of assets by using the vault's `convertToAssets` function.

For instance, each share might represent ~1.2 underlying asset tokens. We use the ERC4626's internal `convertToAssets` function to convert the number of shares to the number of assets, which represent protocol governance votes.

Here is an example of parameters:

```json
{
  "address": "0x44e4c3668552033419520be229cd9df0c35c4417",
  "symbol": "stMGN",
  "decimals": 18
}
```
