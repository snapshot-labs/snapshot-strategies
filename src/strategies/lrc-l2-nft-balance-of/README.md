# lrc-l2-nft-balance-of

Strategy to read account balances for NFTs (72 or 1155) from LoopringV2 subgraph. Assumes we only want tokens minted by a specific account id.

Here is an example of parameters:

```json
{
  "graph": "https://subgrapher.snapshot.org/subgraph/arbitrum/8Z15oyPLRCYzVdNbjKSU2iD8BE6Sj8PZRV4KddDuvuk2",
  "minter_account_id": "74447",
  "tokens": ["token (Collection) id's to include"],
  "blacklisted_account_ids": ["38482"],
  "blacklisted_nft_ids": ["... nft id's to exclude ..."]
}
```

Use explorer.loopring.io to look up addresses and find account id's.

Account id `38482` maps to `0x000000000000000000000000000000000000dead` and is used for burning tokens.

to note: either the `minter_account_id` or the `tokens` parameter must be provided for this query to work. You do not need to specify both, just one of them.
