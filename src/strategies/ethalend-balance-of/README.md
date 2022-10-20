# ethalend-balance-of

This is a strategy made for the protocol ETHALend where we have smartWallets and we need to somehow check
directly the balanceOf in the smartWallet instead of the web3 wallet, it returns the balanceOf the specified ERC20 token
as the web3 wallet key and the value as the balanceOf the smartWallet.

Here is an example of parameters:

```json
{
  "address": "0x6b175474e89094c44da98b954eedeac495271d0f",
  "symbol": "DAI",
  "decimals": 18,
  "registry": "0x583B965462e11Da63D1d4bC6D2d43d391F79af1f"
}
```
