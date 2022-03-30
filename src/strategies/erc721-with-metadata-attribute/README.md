# erc721 with metadata attribute

This strategy allows you to determine the voting power by reading the specified metadata attribute of holding NFT.

Here is an example of parameters:
```json
{
  "address": "0xedCbF9D4CC3BA9aAA896adADeac1b6DF6326f7D8",
  "symbol": "KAP-NFT",
  "attributeName": "level"
}
```

Here is an example of NFT's metadata json schema
```json
{
  "name": "Kapital DAO Guild NFT",
  "description": "This is Guild NFT",
  "image": "https://png.pngitem.com/pimgs/s/19-191340_video-game-icon-png-transparent-png.png",
  "attributes": [
    {
      "trait_type": "level",
      "value": 19
    },
    {
      "trait_type": "stats",
      "value": "active"
    },
    {
      "trait_type": "performance",
      "value": "good"
    }
  ],
  "id": "2"
}
```