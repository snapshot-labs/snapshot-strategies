# marsecosystem

This is the most common strategy, it returns the balances of the voters for a specific ERC20 token.

Here is an example of parameters:

```json
{
  "token": "0x7859B01BbF675d67Da8cD128a50D155cd881B576",
  "miningMasters": [
    { "address": "0xc7B8285a9E099e8c21CA5516D23348D8dBADdE4a", "pid": 0 },
    { "address": "0x48C42579D98Aa768cde893F8214371ed607CABE3", "pid": 0 }
  ],
  "upMiningMasters": [
    { "address": "0x38823CB52d152e0fFe637D63F97f6F771a071Ea0", "pid": 0 },
    { "address": "0x38823CB52d152e0fFe637D63F97f6F771a071Ea0", "pid": 1 },
    { "address": "0x38823CB52d152e0fFe637D63F97f6F771a071Ea0", "pid": 2 },
    { "address": "0x38823CB52d152e0fFe637D63F97f6F771a071Ea0", "pid": 3 }
  ],
  "lps": [
    {
      "lpToken": "0x40B605d8BeED09568E702Deadce90fb23cfd74d8",
      "multi": 1500,
      "miningMasters": [
        {
          "address": "0xc7B8285a9E099e8c21CA5516D23348D8dBADdE4a",
          "pid": 1
        },
        {
          "address": "0x48C42579D98Aa768cde893F8214371ed607CABE3",
          "pid": 1
        }
      ],
      "upMiningMasters": [
        {
          "address": "0x38823CB52d152e0fFe637D63F97f6F771a071Ea0",
          "pid": 4
        },
        {
          "address": "0x38823CB52d152e0fFe637D63F97f6F771a071Ea0",
          "pid": 5
        }
      ]
    },
    {
      "lpToken": "0xe47cCE810174Ac2aCEaB936e6FF93690888bcF24",
      "multi": 2000,
      "miningMasters": [
        {
          "address": "0xc7B8285a9E099e8c21CA5516D23348D8dBADdE4a",
          "pid": 7
        },
        {
          "address": "0x22D8d50454203bd5a41B49ef515891f1aD9f3e53",
          "pid": 3
        }
      ],
      "upMiningMasters": [
        {
          "address": "0x38823CB52d152e0fFe637D63F97f6F771a071Ea0",
          "pid": 6
        }
      ]
    }
  ],
  "symbol": "XMS",
  "decimals": 18
}
```
