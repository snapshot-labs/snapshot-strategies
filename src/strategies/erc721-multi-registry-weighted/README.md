# erc721

This strategy returns the balances of the voters for a list of ERC721 NFT tokens applying a different weight for each.
Token at position `i` is assigned weight at position `i`.

Here is an example of parameters [wizards, ponies, souls]:

```json
{
  "symbol": "FRWC",
  "tokens": [
    "0x521f9c7505005cfa19a8e5786a9c3c9c9f5e6f42",
    "0xf55b615b479482440135ebf1b907fd4c37ed9420",
    "0x251b5f14a825c537ff788604ea1b58e49b70726f"
  ],
  "weights": [2, 4, 8]
}
```
