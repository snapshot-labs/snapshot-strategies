# erc20-balance-of-nft-gated

This strategy is identical to the classic "erc-20-balance-of" strategy, except it requires a user to also have an NFT (ERC-721 and 1155 are both supported) as a gating mechanism. This is useful for requiring any form of ID or reputation in order to vote. It is a binary gate. If the user has a balance of the given NFT, they will be able to use the full balance of their ERC-20. If they don't have a balance, they won't be able to vote at all.

Note: The ERC-721 and ERC-1155 gates use OR logic. Having a balance of any token at all will pass the gate.

Here is an example of parameters:

```json
  {
    "address": "0x6b175474e89094c44da98b954eedeac495271d0f",
    "symbol": "DAI",
    "decimals": 18,
    "erc721GateAddress": "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb",
    "erc1155GateAddress": "0xba0439088dc1e75F58e0A7C107627942C15cbb41",
    "token-ids": ["1","2","3"]
  }
```
