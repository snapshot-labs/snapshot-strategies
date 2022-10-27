# Nine Chronicles DAO voting strategy (by staked assets and D:CC)

This strategy returns calculated score based on staked assets ([Nine Chronicles Gold (NCG)][NCG], [Wrapped Nine Chronicles Gold (wNCG)][wNCG] and [D:CC]) of given accounts.

[NCG]: https://docs.nine-chronicles.com/introduction/intro/nine-chronicles-gold-ncg
[wNCG]: https://etherscan.io/token/0xf203ca1769ca8e9e8fe1da9d147db68b6c919817
[D:CC]: https://dcc.nine-chronicles.com/


## Calculation

The `score` representing the account's voting power will be calculated with:

```
score = (w1 * staked_ncg) + (w2 * staked_wncg) + (w3 * dcc_balance)
```

- `staked_ncg`: The staked NCG amounts of given account. (on Nine Chronicles mainnet)
- `staked_wncg`: The staked wNCG amounts of given account. (on Ethereum mainnet)
- `w1`, `w2`, `w3`: Weights for each amounts. it can be configured by parameters.

Also, the `staked_wncg` of the account will be calculated with:

```
staked_wncg = (wncg_in_vault / total_lp_supply) * staked_lp_tokens
```

- `wncg_in_vault`: The total wNCG amounts that [Balancer] Vault held.
- `total_lp_supply`: The total supply of LP token that Balancer pool issued.
- `staked_lp_tokens`: The staked LP token amounts in the staking contract of given account.
  - This value only refers staking contract from [Planetarium] and staked value on its backed pool (from Balancer) will be ignored.

[Balancer]: https://balancer.fi/
[Planetarium]: https://planetariumhq.com/


## Parameters

- `symbol` - (**Optional**, `string`): The symbol of voting score.
- `ethLPTokenStakingAddress` - (**Required**, `string`): The address of staking contract on Ethereum.
- `ethLPTokenAddres` - (**Required**, `string`): The address of LP token contract on Ethereum.
- `ethWNCGAddress` - (**Required**, `string`): The address of wNCG token contract on Ethereum.
- `ethBalancerVaultAddress` - (**Required**, `string`): The address of Balancer Vault contract on Ethereum.
- `ethDccAddress` - (**Required**, `string`): The address of D:CC token contract on Ethereum.
- `ncGraphQLEndpoint` - (**Required**, `string`): The GraphQL endpoint of Nine Chronicles to query.
- `ncBlockHash` - (**Required**, `string`): The target Block Hash of Nine Chronicles.
- `wNCGDecimal` - (**Optional**, `number`): The decimal precision for wNCG. default is 18.
- `weights` - (**Optional**, `number`): Weight values for the fomular . these values must be integers without decimal parts.
  - `stakedNCG`: Weight for staked NCG. (`w1`)
  - `stakedWNCG`: Weight for staked wNCG. (`w2`)
  - `dcc`: Weight for D:CC. (`w3`)


## Examples

```json
{
  "symbol": "Staked 9c assets + DCC",
  "ethLPTokenStakingAddress": "0xc53b567a70db04e928fb96d6a417971aa88fda38",
  "ethLPTokenAddress": "0xe8cc7e765647625b95f59c15848379d10b9ab4af",
  "ethWNCGAddress": "0xf203ca1769ca8e9e8fe1da9d147db68b6c919817",
  "ethBalancerVaultAddress": "0xba12222222228d8ba445958a75a0704d566bf2c8",
  "ethDccAddress": "0xcea65a86195c911912ce48b6636ddd365c208130",
  "ncGraphQLEndpoint": "http://rpc-for-snapshot.nine-chronicles.com/graphql",
  "ncBlockHash": "711ce4bcdc0fb5264577876f217a794b2448ccce24e3c7ea0fb9794e420863e4",
  "wNCGDecimals": 18,
  "weights": {
    "stakedWNCG": 1,
    "stakedNCG": 1,
    "dcc": 999
  }
}
```
