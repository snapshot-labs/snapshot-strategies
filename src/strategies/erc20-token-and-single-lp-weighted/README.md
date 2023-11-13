# erc20-token-and-single-lp-weighted

This strategy works on pancakeswap v2 style pools or contracts using token0/token1 and reserves.

This strategy calculates the amount of the specified token within a single LP, takes both sides into account, and then uses this as a weight against the user's LP balance.

This strategy also adds users token balance to give a token-weighted score.

This is useful if you want to include LP and token assets and need to scale them to balance each other.

Here is an example of a parameter:

```json
{
  "tokenAddress": "0x06791B2117ed179dB6af1fdc8B2aA86dE76700A6",
  "symbol": "WSLS",
  "lpTokenAddress": "0x370165b24D97BAc5c07246976b80568985C0048B"
}
```
