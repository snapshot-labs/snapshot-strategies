# multidelegation

If you want to delegate your voting power to multiple wallet addresses, you can do this using the multidelegation strategy. This strategy is based on [delegation strategy](https://github.com/snapshot-labs/snapshot-strategies/tree/master/src/strategies/delegation) with the exception that you can delegate to several addresses at the same time.

If A delegates to B and C, A's score is split equally to B and C.
In case A already has previously delegated with the [delegation strategy](https://github.com/snapshot-labs/snapshot-strategies/tree/master/src/strategies/delegation), this multidelegation strategy will override it.

The multidelegation smart contract is in Polygon, so the gas fee to delegate is way lower 💸.

| Param Name                 | Description                                                                                                                                         |
| -------------------------- |-----------------------------------------------------------------------------------------------------------------------------------------------------|
| strategies                 | List of sub strategies to calculate voting power based on delegation                                                                                |
| delegationSpace (optional) | Get delegations of a particular space (by default it takes delegations of current space)                                                            |
| polygonChain (optional)    | Indicates the polygon subgraph to be used to fetch delegations. Possible values are `mumbai` and `mainnet` (by default it uses `mumbai`'s subgraph) |

Here is an example of parameters:

```json
{
  "name": "Example query",
  "strategy": {
    "name": "multidelegation",
    "params": {
      "symbol": "VP (delegated)",
      "polygonChain": "mumbai",
      "delegationSpace": "1emu.eth",
      "strategies": [
        {
          "name": "erc20-balance-of",
          "params": {
            "symbol": "WMANA",
            "address": "0xfd09cf7cfffa9932e33668311c4777cb9db3c9be",
            "decimals": 18
          }
        },
        {
          "name": "erc721-with-multiplier",
          "params": {
            "symbol": "LAND",
            "address": "0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d",
            "multiplier": 2000
          }
        }
      ]
    }
  },
  "network": "1",
  "addresses": [
    "0x56d0B5eD3D525332F00C9BC938f93598ab16AAA7",
    "0x49E4DbfF86a2E5DA27c540c9A9E8D2C3726E278F",
    "0xd7539FCdC0aB79a7B688b04387cb128E75cb77Dc",
    "0x4757cE43Dc5429B8F1A132DC29eF970E55Ae722B",
    "0xC9dA7343583fA8Bb380A6F04A208C612F86C7701",
    "0x69ABF813a683391C0ec888351912E14590B56e88"
  ],
  "snapshot": 17380758
}
```
