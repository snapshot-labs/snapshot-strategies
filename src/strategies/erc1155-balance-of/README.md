# erc1155-balances-of

This strategy return the balances of the voters, for a specific token in a ERC1155 contract.

> Note: If you want to get balance of all tokenIds in the contract, you can use the `erc1155-balance-of-all` strategy. If you have multiple tokenIds, you can use the `erc1155-balance-of-ids` or `erc1155-balance-of-ids-weighted` strategy.

## Params

| param | type | description |
| --- | --- | --- |
| `address` | `string` | The address of the ERC1155 contract |
| `tokenId` | `string` | The tokenId of the token to check |
| `decimals` | `number` | The number of decimals of the token |
| `symbol`(optional) | `string` | The symbol of the token |
