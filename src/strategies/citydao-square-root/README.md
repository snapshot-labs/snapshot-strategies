# CityDAO Square Root Strategy

Holders of an ERC1155 token can cast a number of votes equal to the square root of their net token holdings.

### Example

This example uses [CityDAO's Citizen Token](https://opensea.io/assets/0x7eef591a6cc0403b9652e98e88476fe1bf31ddeb/42).

```json
{
  "symbol": "CITIZEN",
  "address": "0x7EeF591A6CC0403b9652E98E88476fe1bF31dDeb",
  "tokenId": 42,
  "decimals": 0
}
```

### Development

#### Testing

```shell
yarn test --strategy=citydao-square-root
```

#### Changelog

- **0.0.1**
  - Makes initial commit of strategy.
