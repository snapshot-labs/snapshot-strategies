# lrc-nft-dao-search

This is an improvement of karamorf's lrc-l2-nft-balance of Snapshot voting strategy by raecaug(system32).
The extended functionality allows space owners to(alongside all of lrc-l2-nft-balance-of's functionality) specify individual nft ids within a token contract with the nft_ids option.
This option is not needed, and if excluded the query will search for all nfts minted under that token contract address.
No other behavior has been changed.


Strategy to read account balances for NFTs (72 or 1155) from LoopringV2 subgraph. Assumes we only want tokens minted by a specific account id.

Here is an example of parameters:

```json
{
  "graph": "https://api.thegraph.com/subgraphs/name/juanmardefago/loopring36",
  "minter_account_id": "74447",
  "tokens": ["token (Collection contract address) to include"],
  "nft_ids": ["nftIDs, unique to every nft, even those under the same token contract"],
  "blacklisted_account_ids": ["38482"],
  "blacklisted_nft_ids": ["... nft id's to exclude ..."]
}
```

Use explorer.loopring.io to look up addresses and find account id's.

Account id `38482` maps to `0x000000000000000000000000000000000000dead` and is used for burning tokens.

to note: either the `minter_account_id` or the `tokens` parameter must be provided for this query to work. You do not need to specify both, just one of them.
