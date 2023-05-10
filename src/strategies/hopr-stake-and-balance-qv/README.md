# HOPR Stake and Balance QV

This `hopr-stake-and-balance-qv` strategy calculates voting power with:
`(B1 + B2 + B3 + S1 + S2)^0.5`

where:
- B1: balance of HOPR token on mainnet
- B2: balance of HOPR token on Gnosis chain (xHOPR)
- B3: balance of wrapped HOPR token on Gnosis chain (wxHOPR)
- S1: amount of xHOPR token staked into the latest staking season
- S2: amount of wxHOPR token unclaimed from the latest staking season

## Parameters
- "tokenAddress": Contract address of HOPR token on mainnet. Value should be `"0xf5581dfefd8fb0e4aec526be659cfab1f8c781da"`
- "symbol": Token Symbol. Value should be `"HOPR"`.
- "season": Number of the on-going season. E.g. `7`.
- "fallbackGnosisBlock": Fallback block number on Gnosis chain, in case Gnosis block number cannot be translated from Ethereum mainnet due to subgraph issues. E.g. `27852687`,
- "subgraphStudioProdQueryApiKey": Production decetralized subgraph studio query API key. If no key can be provided, use `null`.
- "subgraphStudioDevAccountId": Development subgraph studio account ID. Note that this ID should not be exposed normally. If unknown, use `null`.
- "subgraphHostedAccountName": Legacy hosted subgraph account name. Vallue is `"hoprnet"`.
- "useStake": If the staking program should be consided. If `false`, `S1 + S2 === 0`. Value should be set to `true`.
- "useHoprOnGnosis": If tokens on Gnosis chain should be consided. If `false`, `B2 + B3 === 0`. Value should be set to `true`.
- "useHoprOnMainnet": If tokens on Ethereum mainnet should be consided. If `false`, `B1 === 0`. Value should be set to `true`.
- "subgraphStudioProdAllSeasonQueryId": Production stake all season subgraph ID .Value is `"DrkbaCvNGVcNH1RghepLRy6NSHFi8Dmwp4T2LN3LqcjY"`.
- "subgraphStudioDevAllSeasonVersion": Latest development version of the stake all season subgraph. E.g. `"v0.0.9"`
- "subgraphStudioDevAllSeasonSubgraphName": Name of the staking subgraph in Graph Studio. Value should be `"hopr-stake-all-seasons"`.
- "subgraphHostedAllSeasonSubgraphName": Name of the staking subgraph in Graph Hosted service. Value should be `"hopr-stake-all-seasons"`.
- "subgraphStudioProdHoprOnGnosisQueryId": Latest development version of the HOPR token balances on Gnosis subgraph. Value should be `"njToE7kpetd3P9sJdYQPSq6yQjBs7w9DahQpBj6WAoD"`.
- "subgraphStudioDevHoprOnGnosisSubgraphName": Name of the HOPR token balances on Gnosis subgraph in Graph Studio. Value should be "hopr-on-gnosis"`
- "subgraphStudioDevHoprOnGnosisVersion": Latest development version of the HOPR token balances on Gnosis subgraph. E.g. "v0.0.2"`
- "subgraphHostedHoprOnGnosisSubgraphName": Name of the the HOPR token balances on Gnosis in Graph Hosted service. Value should be `"hopr-on-xdai"`
