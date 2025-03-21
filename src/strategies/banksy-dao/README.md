# BanksyDAO

  In Banksy Farm, NFTs are the backbone of the platform ownership. And the way to participate in this DAO.

Our NFTs are composed by various skills, as shown [here](https://docs.banksy.farm/nfts/nft-composition).
One of the skill is "Experience", that starts at 0. And get increased as each community member uses this card.

This BanksyDAO strategy consists in reading the "Experience" skill of each NFT that the wallet owner has, and the following logic:
1. If the NFTs has 0 "Experience", then it's vote value is 1.
2. IF the NFTs has more than 0 "Experience", then the vote value equals the 1 + and extra value of the experience.
3. IF the wallet has multiple NFTs. then the vote value is the sum of all NFTs.


## Strategy Parameters

  

Example strategy params:

  

```json
[
  {
    "name": "dao banksy farm",
    "strategy": {
      "name": "banksy-dao",
      "params": {
        "address": "0x942d791ab07e33Fe4B780Fc0b3874a24Ac3da433",
        "symbol": "BanksyNFT"
      }
    },
    "network": "43114",
    "addresses": [
      "0x503d2E56055c7078905369D7fA43c6f20C70a43a",
      "0x2730bd7b669e2B5fC6abcDBdf048f0D8e5b0fBE6",
      "0xb0dD83eDeB1e615F8E638F4824BA86C8053dF366"
    ],
    "snapshot": 10085683
  }
]

```

#####  DAO BANKSY.FINANCE ENHANCED BY NFT

