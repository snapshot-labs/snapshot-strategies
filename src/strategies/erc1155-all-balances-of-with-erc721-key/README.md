# erc1155-all-balances-of-with-erc721-key

This strategy uses an ERC721 as a key to enable a voters vote power to be counted. The strategy returns the balances of the voters for all tokens in selected ERC1155 contracts across different networks, which form the vote power. Vote power is counted as long as the voter has one of the ERC721 keys, if not then vote power is 0.

This strategy assumes that the token id's for the ERC1155 contracts are the same across the different networks being polled. It also assumes the ERC721 key is on Ethereum Mainnet.

Here is an example of the parameters:

```json
{
    "networks": [
        {
        "networkId": "1",
        "erc1155Address": "0x265adf13881c1d88eec6e0b6073a6271d33b2000"
        },
        {
        "networkId": "137",
        "erc1155Address": "0x99a63fD2C3b4f6E9E1DC914B08811fd3b9F1dc00"
        }
    ],
    "tokenIds": [
        0,
        1
    ],
    "erc721KeyAddress": "0xd88329bf3b7776bff90d0c942f160cb55bf5baec"
}
```
