# Coinswap

This is the most common strategy, it returns the balances of the voters for a balances CSS token
in Coinswap project(pools, farms, Liquidity, token).

Here is an example of parameters:
```json
[
  {
    "name": "Example query Coinswap",
    "strategy": {
      "name": "coinswap",
      "params": {
        "address": "0x3bc5798416c1122BcFd7cb0e055d50061F23850d",
        "masterChef": "0x3A0a988D680dBBB02DECBfd35F9E0676B4bEc292",
        "smartChef": [
          "0x496a0227f7f16622650DDf2601B6842e845203C5",
          "0xa25EA2B60c1a1365f195Cfda61b9fb7Eb8fcC38B",
          "0x5Ca94e1b35C0a726E5431F66DBECDD2253cA6cb1",
          "0x29a888e301A9fF0f4420a115F61E6ad0750Db9dE"
        ],

        "cssLPs": [
          {
            "address": "0xfA8E0C0568edcDD3D9b12B48792a5B00018FdB57",
            "pid": 1 
          },
          {
            "address": "0x2f32E2252a6979704F0f540b7988Fa8B8C36B292",
            "pid": 2
          }
        ],
        "symbol": "CSS",
        "decimals": 18
      }
    },
    "network": "56",
    "addresses": [
      "0x3a675f2fff053494aa0e9f753f912c4be314d1e7",
      "0x2101e095244b4fd2ff228725faa692fd7261c074"
    ],
    "snapshot": 9837410
  }
]


```
