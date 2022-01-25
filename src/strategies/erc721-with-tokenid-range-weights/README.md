# erc721 with tokenid range weights

This strategy allows you to weight erc721's with different values by defining ranges of id's. If it does not match a range, it will use the defaultWeight.

Here is an example of parameters:

```json
{
  "address": "0x22C1f6050E56d2876009903609a2cC3fEf83B415",
  "symbol": "POAP",
  "defaultWeight": 1,
  "tokenIdWeightRanges": [
    { "start": 0, "end": 3000, "weight": 1 },
    { "start": 3001, "end": 6000, "weight": 2 }
  ]
}
```
