# riskharbor-underwriter

This strategy allows underwriters in a given Risk Harbor vault to vote based on the shares issued to them across their various positions in that vault. This strategy works by querying the vault's subgraph to compute how many shares each user holds and divides that amount by the decimals in the underwriting asset.

```json
{
  "SUBGRAPH_URL": "https://api.thegraph.com/subgraphs/name/some-protocol/v1-protocol",
  "VAULT_ADDR": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"
}
```
