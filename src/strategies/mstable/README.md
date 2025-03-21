# mstable

Calls getVotes() on both the stkMTA and stkBPT contracts, these balances are then summed to generate a users vMTA balance.

## Examples

```JSON
{
  "strategies": [
    {
      "name": "mstable",
      "params": {
        "stkBPT": "0xefbe22085d9f29863cfb77eed16d3cc0d927b011",
        "stkMTA": "0x8f2326316eC696F6d023E37A9931c2b2C177a3D7",
      }
    }
  ]
}
```
