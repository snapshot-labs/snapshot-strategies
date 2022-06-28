# Biswap

This is the most common strategy, it returns the balances of the voters for a balances BSW token
in Biswap project(pools, farms, Liquidity, token).

Here is an example of parameters:
```json
[
  {
    "name": "Example query Biswap",
    "strategy": {
      "name": "biswap",
      "params": {
        "address": "0x965F527D9159dCe6288a2219DB51fc6Eef120dD1",
        "masterChef": "0xDbc1A13490deeF9c3C12b44FE77b503c1B061739",
        "autoBsw": "0x97a16ff6fd63a46bf973671762a39f3780cda73d",
        "autoBswSecond": "0xa4b20183039b2F9881621C3A03732fBF0bfdff10",
        "bswLPs": [
          {
            "address": "0x2b30c317cedfb554ec525f85e79538d59970beb0",
            "pid": 9
          },
          {
            "address": "0x46492b26639df0cda9b2769429845cb991591e0a",
            "pid": 10
          }
        ],
        "symbol": "BSW",
        "decimals": 18
      }
    },
    "network": "56",
    "addresses": [
      "0xdBE55A0daDc80EF88e884f15CE41c26c0Af933a0"
    ],
    "snapshot": 15078771
  }
]


```
