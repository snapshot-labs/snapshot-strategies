# LP Liquidity Position for $BOO Pools [Sonic]
This strategy calculates the liquidity position of users in pools where $BOO is one of the tokens. It utilizes data from a subgraph to compute the net liquidity by analyzing mint and burn events.

## Overview
The strategy queries the following pools:

Pool 1: 0x686d873a9e0696afaca0bc163dcc95b577d9e3e8  wS/BOO

Pool 2: 0xf4dcfaa2711908a8c61d9516d84b24ffdae241db  WETH/BOO

Pool 3: 0xb7228a39cdd2c734064fc95c54e75910ff06eed6  USDC.E/BOO

Pool 4: 0x84d4716c1cf4d7b1b1c247ad69b62fa72ccc46d7  wS/BOO

Pool 5: 0xaa4ee51f55f9baa7cf180fbaf2688cc35fdc8012  BOO/TONS

The strategy uses a subgraph to fetch mint and burn events, calculates the net liquidity position, and assigns scores to the provided addresses based on their activity.