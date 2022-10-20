# Nine Chronicles DAO voting strategy (by staked assets and D:CC)

This strategy returns calculated score based on staked assets ([Nine Chronicles Gold (NCG)][NCG], [LP Token for [wNCG](20WETH-80WNCG)][20WETH-80WNCG] and [D:CC]) of given accounts.

[NCG]: https://docs.nine-chronicles.com/introduction/intro/nine-chronicles-gold-ncg
[20WETH-80WNCG]: https://etherscan.io/token/0xe8cc7E765647625B95F59C15848379D10B9AB4af
[wNCG]: https://etherscan.io/token/0xf203ca1769ca8e9e8fe1da9d147db68b6c919817
[D:CC]: https://dcc.nine-chronicles.com/


## Calculation

```
score = (w1 * staked_ncg) + (w2 * staked_lp_tokens) + (w3 * dcc_balance)
```

- `staked_ncg`: The staked NCG amounts of given account. (on Nine Chronicles mainnet)
- `staked_lp_tokens`: The staked LP token amounts in the staking contract of given account. (on Ethereum mainnet)
  - This value only refer staking contract from [Planetarium] and staked value on its backeed pool will be ignored.
- `w1`, `w2`, `w3`: Weights for each amounts. it can be configured by parameters.


## Parameters

- `symbol` - (**Optional**, `string`): The symbol of voting score.
- `ethLPTokenStakingAddress` - (**Required**, `string`): The address of staking contract on Ethereum.
- `ethDccAddress` - (**Required**, `string`): The address of D:CC token contract on Ethereum.
- `ncGraphQLEndpoint` - (**Required**, `string`): The GraphQL endpoint of Nine Chronicles to query.
- `ncBlockHash` - (**Required**, `string`): The target Block Hash of Nine Chronicles.
- `lpTokenDecimal` - (**Optional**, `number`): The decimal precision for staked token. default is 18.
- `weights` - (**Optional**, `number`): Weight values for the fomular . these values must be integers without decimal parts.
  - `stakedNCG`: Weight for staked NCG. (`w1`)
  - `stakedLPToken`: Weight for staked LP token. (`w2`)
  - `dcc`: Weight for D:CC. (`w3`)


## Examples

```json
{
  "symbol": "Staked 9c assets + DCC",
  "ethLPTokenStakingAddress": "0xcc2db561d149a6d2f071a2809492d72e07838f69",
  "ethDccAddress": "0xcea65a86195c911912ce48b6636ddd365c208130",
  "ncGraphQLEndpoint": "http://9c-main-rpc-31.nine-chronicles.com/graphql",
  "ncBlockHash": "711ce4bcdc0fb5264577876f217a794b2448ccce24e3c7ea0fb9794e420863e4",
  "lpTokenDecimal": 18,
  "weights": {
    "stakedToken": 1,
    "stakedNCG": 1,
    "dcc": 999
}
```
