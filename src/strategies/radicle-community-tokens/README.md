# radicle-community-tokens

This strategy is used to calculate voting power from the Radicle funding subgraph with the entity NFT and field `amtPerSec`. Each voter can have multiple NFTs, each with specific `amtPerSec`. The voters' voting power would be the sum of all the `amtPerSec`. If a fundingProject `id` is provided the summation is done only over NFTs of that project. 

Here is an example of parameters:

```json
{
    "symbol": "DAI",
    "decimals": 18,
    "fundingProject": "0x488fc5d6e43259f87f816556a7ab99dc78cfbab6"
}
```
