# rari-fuse

Returns the voter's underlying collateral balances in a given Rari Fuse market (fToken).

Here is an example of parameters:

- `symbol` - (**Optional**, `string`) Symbol of the underlying ERC20 token
- `decimals` - (**Required**, `number`) Decimal precision of the underlying ERC20 token
- `fTokenAddress` - (**Required**, `string`) Address of the fToken (aka. market) in Rari Fuse

```json
{
  "symbol": "BANK",
  "decimals": 18,
  "fTokenAddress": "0x250316B3E46600417654b13bEa68b5f64D61E609"
}
```
