# sismo-badge-voting-power

This strategy is used for weighted voting with ERC-1155 tokens. 

This strategy is used by Sismo for private weighted voting with the Sismo Contributor ZK Badge (tokenId 15151111) on Polygon.
Here are the different weights used for the tiers, alongside the Badge contract address on Polygon and the Bagde tokenId.

```json
"params": {
    "address": "0xF12494e3545D49616D9dFb78E5907E9078618a34",
    "tokenId": 15151111,
    "tierWeights": {
        "1": 1, 
        "2": 10, 
        "3": 100
    }
}
```