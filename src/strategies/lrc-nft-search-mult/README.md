# lrc-nft-search-mult

This is a further improvement of karamorf's lrc-l2-nft-balance of Snapshot voting strategy by raecaug(system32).

This strategy is an extension of lrc-nft-dao-search, allowing space owners to apply a multiplier to counted votes. 
This can then be combined with additional voting strategies to allow for complex DAO setups with vote weighting of specific NFTs.
Providing a multiplier is necessary; if default behavior is desired, simply specify '1'.

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
  "multiplier": "3" // Setting this to '1' will result in normal vote counting behavior. 
}
```

Use explorer.loopring.io to look up addresses and find account id's.

Account id `38482` maps to `0x000000000000000000000000000000000000dead` and is used for burning tokens.

to note: either the `minter_account_id` or the `tokens` parameter must be provided for this query to work. You do not need to specify both, just one of them.
