# recusal-list

This is strategy for disallowing certain address from voting due to conflict of interest or other reasons for recusal.
You can pass any strategy as an optionnal parameter to combine the recusal with another one.

Below is an example of parameters. The address list renotes which addresses to restrict. The strategy and its params defines the strategy to use if needed.

```json
{
  "addresses": [
    "0xa478c2975ab1ea89e8196811f51a7b7ade33eb11",
    "0xeF8305E140ac520225DAf050e2f71d5fBcC543e7"
  ],
  "strategy": {
    "name": "erc721",
    "params": {
      "address": "0x3B8CeB26f4FabACbD02b22caeceeb26D67E4013A",
      "symbol": "MLZ"
    }
  }
}
```
