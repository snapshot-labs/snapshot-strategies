# erc20-votes strategy

This strategy gets voting power from compound like contracts, it uses `getVotes` function to get the voting power of an address.

## Params

| Param | Type | Description |
| --- | --- | --- |
|`address`|`string`|The address of the contract to get the voting power from|
|`symbol`|`string`|The symbol of the token|
|`decimals`|`number`|The decimals of the token|
