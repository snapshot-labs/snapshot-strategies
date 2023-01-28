# axolittles-dao

Voting strategy for the axolittles-dao. Number of votes depends on balance of ERC-721 tokens on ethereum, balance of ERC-721 tokens on arbitrum, and staked balance on both of those chains.

Here is an example of parameters:

```json
[
  {
    "name": "Example Query",
    "strategy": {
      "name": "axolittles-dao",
      "params": {
        "symbol": "AXO",
        "decimals": 0
      }
    },
    "network": "1",
    "addresses": [
      "0x4F17562C9a6cCFE47c3ef4245eb53c047Cb2Ff1D",
      "0x3c4B8C52Ed4c29eE402D9c91FfAe1Db2BAdd228D",
      "0xd649bACfF66f1C85618c5376ee4F38e43eE53b63",
      "0x726022a9fe1322fA9590FB244b8164936bB00489",
      "0xc6665eb39d2106fb1DBE54bf19190F82FD535c19",
      "0x6ef2376fa6e12dabb3a3ed0fb44e4ff29847af68",
      "0x2573CC07e0B8cf1d294a9D1aF763C6D97E4E3424"
    ],
    "snapshot": 15108811
  }
]

```
