# ERC20 BalanceOf If Own ERC721 Strategy

This strategy return the following voting power:
- 0 if the address doesn't own any of the ERC721 NFTs in *nftAddress*
- *erc20Address*.balance(of) if the address owns at least one of those NFTs.

## Accepted options

- **nftAddress:** ERC721 NFT address;

- **erc20Address:** ERC20 token address;

- **decimals:** Number of decimals in ERC20 token.

## Examples

```JSON
{
  "nftAddress": "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb",
  "erc20Address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  "symbol": "WETH",
  "decimals": 18
}
```
