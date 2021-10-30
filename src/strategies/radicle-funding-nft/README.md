# radicle-funding-nft

This strategy is used to calculate voting power from the Radicle funding subgraph with the entity NFT and field `amtPerSec`. Each voter can have multiple NFTs, each with specific `amtPerSec`. The voters' voting power would be the sum of all the `amtPerSec`.

Here is an example of parameters:

```json
{
  "address": "0x6b175474e89094c44da98b954eedeac495271d0f",
  "symbol": "DAI",
  "decimals": 18
}
```
