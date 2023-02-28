# Moonbeam Free Balance strategy

This strategy return the free balances on Moonbeam network. The free balance includes the "locked" tokens, which can be used for voting, but not the "reserved" tokens.

## Examples

```JSON
[
  {
    "name": "moonbeam-free-balance",
    "strategy": {
      "name": "moonbeam-free-balance",
      "params": {}
    },
    "network": "1284",
    "addresses": [ 
      "0xf02ddb48eda520c915c0dabadc70ba12d1b49ad2",
      "0x01bb6ce8b88f09a7d0bfb40eff7f2ad5e0df2e98",
      "0xe751b9ea560a200161d1b70249495e3d22ec5b00"
    ],
    "snapshot": 14129872
  }
]
```
