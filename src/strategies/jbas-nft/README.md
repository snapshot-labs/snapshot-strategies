# jbas-nft

This is a custom strategy that defines the voting logic for the Japanese Born Ape Society project. 

One vote is assigned to each user that holds:

1. one unit of the JBAS [ERC721 collection](https://etherscan.io/token/0x56cA59ab1b3c7086b3c4aF417593fDeE566A3320)
2. and one unit of a specific token ID from the Japanese Apes Flower Shop [ERC1155 collection](https://etherscan.io/token/0x56cA59ab1b3c7086b3c4aF417593fDeE566A3320)

> The Japanese Apes Flower Shop has 7 different token ids [0, 6]

Here is an example of parameters:

```json
{
  "jafsTokensId": 0
}
```
