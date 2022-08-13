# erc20-token-and-lp-weighted

This strategy works on Uniswap v2 style pools or contracts utilising token0/token1 and reserves.

This strategy calculates the qty of the specified token within a single LP, doubles it to account for both sides, and then uses it as a weight against the users LP balance.

This strategy also additionally adds the users token balance to give a token weighted score.

This is useful if you want to be inclusive of LP and token holdings and need to scale them to be balanced with each other.

Here is an example of parameters:

```json
{
    "tokenAddress": "0x88ACDd2a6425c3FaAE4Bc9650Fd7E27e0Bebb7aB",
    "symbol": "MIST",
    "lpTokenAddress": "0xcd6bcca48069f8588780dfa274960f15685aee0e"
}
```
