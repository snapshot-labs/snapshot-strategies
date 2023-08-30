# Moonbase

This is the strategy, it returns the balances of the voters for MBG token balances
in Moonbase project(pools, farms, vaults, token).

Here is an example of parameters:

```json
[
  {
    "name": "Example query Moonbase",
    "strategy": {
      "name": "moonbase",
      "params": {
        "address": "0xc97c478Fc35d75b51549C39974053a679A5C67E1",
        "masterChef": "0x830304d6C669d33738c7E4c1F2310CC1E530Df63",
        "moonbaseLPs": [
          {
            "address": "0xfbfe53025c54b70b48070904f8765703D2aD749D",
            "pid": 1
          },
          {
            "address": "0x161962Aec8f3c61D865cd5d53A334780763364e6",
            "pid": 2
          }
        ],
        "symbol": "MBG",
        "decimals": 18
      }
    },
    "network": "84531",
    "addresses": [
      "0xe32C26Be24232ba92cd89d116985F81f94Dd26a8",
    ],
    "snapshot": 10819269
  }
]
```
