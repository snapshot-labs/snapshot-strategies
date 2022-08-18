# erc20-balance-of

This is the most common strategy, it returns the balances of the voters for a specific ERC20 token.

Here is an example of parameters:

```json
{
  "address": "0x6b175474e89094c44da98b954eedeac495271d0f",
  "symbol": "DAI",
  "decimals": 18
}
```

> **Warning**: This strategy uses `ethers.utils.BigNumber.toNumber()` and will fail if a voter's weighted score (# nfts * weight) is is greater than or equal to `Number.MAX_SAFE_INTEGER` or less than or equal to `Number.MIN_SAFE_INTEGER`
