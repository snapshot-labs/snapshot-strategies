# lrc-l2-nft-balance-of

Strategy to read account balances for NFTs (72 or 1155) from LoopringV2 subgraph. Assumes we only want tokens minted by a specific account id.

Here is an example of parameters:

```json
{
  "graph": "https://api.thegraph.com/subgraphs/name/juanmardefago/loopring36",
  "minter_account_id": "74447",
  "blacklisted_account_ids": ["38482"]
}
```

Use explorer.loopring.io to look up addresses and find account id's.

Account id `38482` maps to `0x000000000000000000000000000000000000dead` and is used for burning tokens.
