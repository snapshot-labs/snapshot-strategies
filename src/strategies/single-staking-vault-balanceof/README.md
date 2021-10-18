# single-staking-vault-balanceof

Used for fetching the staked token balance in a single staking vault

The only parameter is the vault address. The vault must
have the function call `wantLockedTotal(address)` which should 
return the amount of tokens in the vault.

```json
{
  "vaultAddress": "0xA68E643e1942fA8635776b718F6EeD5cEF2a3F15"
}
```
