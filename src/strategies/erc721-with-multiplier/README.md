# erc721-with-multiplier

This strategy return the balances of the voters for a specific ERC721 NFT with an arbitrary multiplier.

## Params

| Param | Type | Description | Default |
| --- | --- | --- | --- |
|`address`|`string`|The address of the ERC721 contract to get the balances from| |
|`multiplier`|`number`|The multiplier to apply to the balances| 1 |
|`symbol`|`string`|The symbol of the ERC721 token| |

## Example

```json
{
  "address": "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB",
  "multiplier": 100,
  "symbol": "PUNK"
}
```
