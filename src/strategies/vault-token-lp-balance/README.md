# vault-token-lp-balance

This strategy computes the amount of a token
in a vault lp pool. The vault must use the function `stakedWantTokens(pid, user)`.

You must supply the token, vault address, lp address, and pid of the pool
in the vault chef. Here is an example of the params:

```json
{
  "tokenAddress": "0x0159ED2E06DDCD46a25E74eb8e159Ce666B28687",
  "tokenDecimals": 18,
  "vaultChefAddress": "0x2914646E782Cc36297c6639734892927B3b6Fe56",
  "pid": 8,
  "lpAddress": "0xE2E34C07754C4CAb2b6D585C06D418628f8ba553"
}
```
