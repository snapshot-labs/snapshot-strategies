# rari-fuse

Returns the voter's underlying collateral balances in a given Rari Fuse market (fToken).

Here is an example of parameters:

- `symbol` - (**Optional**, `string`) Symbol of the underlying ERC20 token
- `token` - (**Required**, `string`) Address of the underlying token.
- `fToken` - (**Required**, `string`) Address of the fToken (Rari Fuse market)

```json
{
  "symbol": "BANK",
  "token": "0x2d94AA3e47d9D5024503Ca8491fcE9A2fB4DA198",
  "fToken": "0x250316B3E46600417654b13bEa68b5f64D61E609"
}
```

## Reference

For details about exchange rate between fTokens and underlying tokens, see
https://docs.rari.capital/fuse/#interpreting-exchange-rates
