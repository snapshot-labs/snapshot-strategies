# erc721-with-balance

This strategy returns a singular vote based on a minimum NFT holding threshold (default 1)

> Intended for the use of *1 wallet = 1 vote* scenarios

## examples

A single vote weight for any address holding 1 or more CryptoPunks

```json
{
  "address": "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB",
  "symbol": "PUNK"
}
```
A single vote weight for any address holding 3 or more CryptoPunks

```json
{
  "address": "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB",
  "symbol": "PUNK",
  "minBalance": 3
}
```
