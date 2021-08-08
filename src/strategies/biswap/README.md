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
        "smartChef": [
          "0x973304a8E7B13Dc9A26769E85d7Cc945f4Fda649",
          "0x112Ff6a467DA8B70578D5c74f88FE22c5d6d4EeF",
          "0xf31f62a6afb0546771a821e0f98fd187ee7f7d4c"
        ],
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
      "0x3a675f2fff053494aa0e9f753f912c4be314d1e7",
      "0x2101e095244b4fd2ff228725faa692fd7261c074"
    ],
    "snapshot": 9837014
  }
]

```
