
# SandManDAO

  In Sandman Finance, NFTs are the backbone of the platform ownership. And the way to participate in this DAO.

Our NFTs are composed by various skills, as shown [here](https://docs.death.sandman.finance/nfts/nft-cards-composition).
One of the skill is "Experience", that starts at 0. And get increased as each community member uses this card.

This SandmanDAO strategy consists in reading the "Experience" skill of each NFT that the wallet owner has, and the following logic:
1. If the NFTs has 0 "Experience", then it's vote value is 1.
2. IF the NFTs has more than 0 "Experience", then the vote value equals the 1 + and extra value of the experience.
3. IF the wallet has multiple NFTs. then the vote value is the sum of all NFTs.


## Strategy Parameters

  

Example strategy params:

  

```json

[

{

"name": "DAO sandman.finance",

"strategy": {

"name": "sandManDAO",

"params": {

"address": "0x743F554f6AcCd4E452AF6C96c48B78E849d87316",

"symbol": "TheEndless"

}

},

"network": "137",

"addresses": [

"0xA34f2b833753bCDb6e652A87B0d363FF8f1eE9c5",

"0x6fEc079288329553F4d4512be33d05d5793e1f31"

],

"snapshot": 24110041

}

]
```

#####  DAO SANDMAN.FINANCE ENHANCED BY NFT