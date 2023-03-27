# aura-vault-balance-of-single-asset

This strategy returns the balance of an underlying asset in a BPT LP pair staked on Aura

For example:
- aura50WETH-50AURA-vault total supply: 137,880 (staked BPT)
- 50WETH-50AURA total supply: 145,710 (unstaked BPT)
- token of interest (either WETH or AURA): AURA
- Alice aura50WETH-50AURA-vault balance: 50,000
- 50WETH-50AURA total Aura balance: 1,878,388

_Note: aura50WETH-50AURA-vault and 50WETH-50AURA minted 1:1_

Alice AURA balance: 1,878,388 AURA * 50,000 / 145,710 = 644,563 AURA

## Params

- `auraVaultDeposit` - (**Required**, `string`) Address of aura vault deposit token (ex: aura50WETH-50AURA-vault address)
- `tokenIndex` - (**Required**, `string`) Index of token in 50/50 pair on Balancer Vault
- `decimals` - (**Required**, `string`) Decimals of underlying asset

Here is an example of parameters:

```json
{
    "auraLocker": "0x712cc5bed99aa06fc4d5fb50aea3750fa5161d0f",
    "auraVoterProxy": "1",
    "votingEscrow": "18"
}
```
