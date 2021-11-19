# erc721-with-balance

This is a strategy to allow egalitarian voting power to holders of an ERC-721 token.

A `minBalance` can be defined. It returns a voting power of `1` if the balance of the voter for a specific ERC-721 token is greater than or equal to the minBalance.

Here is an example of parameters:

```json
{
  "address": "0x25ed58c027921e14d86380ea2646e3a1b5c55a8b",
  "symbol": "DEVS",
  "minBalance": 1
}
```
