# EPNS Governance: Voting

This strategy weighs the vote using:
- Amount of `$PUSH` Delegated to user
- Amount of `$PUSH` Staked in 1st Yeild Farm
- Amount of `$PUSH-LP` Staked in 2nd Yeild Farm

The voting power is calculated in terms of `$PUSH`, so `$PUSH-LP` tokens are converted to `$PUSH` using on chain data from Uniswap-V2 Router, WETH and USDT token contracts.

- Example Parameters:
```JSON
{
    "epnsTokenAddr": "0xf418588522d5dd018b425E472991E52EBBeEEEEE",
    "epnsLPTokenAddr": "0xaf31fd9c3b0350424bf96e551d2d1264d8466205",
    "stakingAddr": "0xB72ff1e675117beDefF05a7D0a472c3844cfec85",
    "symbol": "PUSH",

    "uniswapV2Router02": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    "WETHAddress": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    "USDTAddress": "0xdac17f958d2ee523a2206206994597c13d831ec7",
          
    "decimals": 18
}
```