# erc721 with tokenid range weights

This strategy allows you to weight erc721's with different values in a mapping.

Here is an example of parameters:

```json
{
  "address": "0xEa25e2b3E35c67876957EE00a28Cd912ff113F54",
        "symbol": "LAND",
        "defaultWeight": 1,
        "tokenIdWeight": {
          "1": 1,
          "2": 1,
          "3": 1,
          "4": 3,
        }
}
```
