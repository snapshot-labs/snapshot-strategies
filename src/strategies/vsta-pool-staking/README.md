# vsta-pool-staking

This strategy returns voters underlying VSTA token balance for lping and staking to our reward farms

## Params

- `symbol` - (**Optional**, `string`) Symbol of ERC20 token
- `decimals` - (**Required**, `number`) Decimal precision for ERC20 token
- `balancerVaultAddress` - (**Required**, `string`) Address of Balancer Vault to get token balances of LPs
- `poolAddress` - (**Required**, `string`) Address of VSTA-TOKEN lp token
- `poolId` - (**Required**, `string`) Balancer pool ID of VSTA-TOKEN lp
- `farmAddress` - (**Required**, `string`) Vesta farm address
- `vstaAddress` - (**Required**, `string`) Vesta token address

Here is an example of parameters:

```json
{
  "balancerVaultAddress": "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
  "poolAddress": "0xC61ff48f94D801c1ceFaCE0289085197B5ec44F0",
  "poolId": "0xc61ff48f94d801c1ceface0289085197b5ec44f000020000000000000000004d",
  "farmAddress": "0x65207da01293C692a37f59D1D9b1624F0f21177c",
  "vstaAddress": "0xa684cd057951541187f288294a1e1C2646aA2d24",
  "symbol": "VSTA",
  "decimals": 18
}
```
