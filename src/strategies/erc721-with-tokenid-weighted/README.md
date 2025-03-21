# erc721-with-tokenid-weighted

This strategy is a modification of erc721-with-tokenid by dimsome. Instead of a maximum one vote per wallet, this strategy allows for multiple votes from a single wallet. For example, a wallet containing three whitelisted ERC721 TokenIDs would receive three votes.

In short, this strategy provides one vote per whitelisted ERC721 TokenID- regardless of wallet distribution.

Here is an example of parameters:

```json
{
  "address": "0x30cDAc3871c41a63767247C8D1a2dE59f5714e78",
  "symbol": "Reaper(s)",
  "tokenIds": ["2112", "2871", "3221", "3587"]
}
```
