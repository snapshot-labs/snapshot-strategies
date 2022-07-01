# arrakis-finance

This strategy returns voters underlying token balance for a given Arrakis Finance pool

## Params

- `symbol` - (**Optional**, `string`) Symbol of ERC20 token
- `decimals` - (**Required**, `number`) Decimal precision for ERC20 token
- `tokenAddress` - (**Required**, `string`) Address of ERC20 token contract
- `poolAddress` - (**Required**, `string`) Address of Arrakis Finance pool (aka. vault) contract

Here is an example of parameters:

```json
{
  "symbol": "BANK",
  "decimals": 18,
  "tokenAddress": "0x2d94AA3e47d9D5024503Ca8491fcE9A2fB4DA198",
  "poolAddress": "0x472D0B0DDFE0BC02C27928b8BcbD67E65D07d48a"
}
```
