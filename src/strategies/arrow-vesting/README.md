# arrow-vesting

This strategy returns voters underlying token balance for a given Arrow vesting contract factory.

Token balance for is address is equal to the sum of the locked balance in all vesting contracts holding it
as a beneficiary.

## Params

- `address` - (**Required**, `string`) Address of ERC20 token contract
- `symbol` - (**Optional**, `string`) Symbol of ERC20 token
- `decimals` - (**Required**, `number`) Decimal precision for ERC20 token
- `vestingFactory` - (**Required**, `string`) Address of Vesting Escrow Factory that creates vesting contracts holding ERC20 tokens 

Here is an example of parameters:

```json
{
    "address": "0x78b3C724A2F663D11373C4a1978689271895256f",
    "symbol": "ARROW",
    "decimals": 18,
    "vestingFactory": "0xB93427b83573C8F27a08A909045c3e809610411a"
}
```
