# Voting shares of VOLT token stakers and holders

This strategy computes users shares of volt token (erc-20) in an lp pool.

The strategy calculates user votes using this formula : user's volt balance + staked volt balance + User LP share mapped volt balance

You must supply the voltwap token address, symbol, decimals, network id, swap subgraph url, staking subgraph url and token address of the lp token.

```json
{
  "symbol": "VOLT",
  "tokenDecimals": 18,
  "lpTokenAddress": "0x1071392e4cdf7c01d433b87be92beb1f8fd663a8",
  "voltAddress": "0x8df95e66cb0ef38f91d2776da3c921768982fba0",
  "network": "82",
  "swapSubgraph": "https://graph-meter.voltswap.finance/subgraphs/name/meterio/uniswap-v2-subgraph",
  "stakingSubgraph": "https://graph-meter.voltswap.finance/subgraphs/name/meter/geyser-v2"
}
```
