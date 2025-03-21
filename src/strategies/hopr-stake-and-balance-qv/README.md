# HOPR Stake and Balance QV

This `hopr-stake-and-balance-qv` strategy calculates voting power with:
`(B1 + B2 + sum((B_i + S_i) * F_i)) ^ exponent`

where:
- B1: HOPR token balance in the voting account on the mainnet
- B2: xHOPR token & wxHOPR token balance in the voting account on the Gnosis chain
- B_i: xHOPR token & wxHOPR token balance in the "Staking Safe", where the voting account is an owner, on the Gnosis chain
- S_i: wxHOPR token staked in outgoing HOPR Channels by HOPR nodes that are managed by the "Staking Safe", where the voting account is an owner, on the Gnosis chain
- F_i: Share of the voting account in the "Staking Safe", where the voting account is an owner, on the Gnosis chain
- exponent: Quadratic Voting-like exponent value. E.g., for quadratic-voting, the exponent is 0.5. This value can be set by the community to any value between 0 and 1, inclusive. Currently it is set at 0.75.


## Parameters
- "tokenAddress": Contract address of HOPR token on mainnet. Value should be `"0xf5581dfefd8fb0e4aec526be659cfab1f8c781da"`
- "symbol": Token Symbol. Value should be `"HOPR"`.
- "fallbackGnosisBlock": Fallback block number on Gnosis chain, in case Gnosis block number cannot be translated from Ethereum mainnet due to subgraph issues. E.g. `27852687`,
- "subgraphStudioProdQueryApiKey": Production decentralized subgraph studio query API key. If no key can be provided, use `null`.
- "subgraphStudioDevAccountId": Development subgraph studio account ID. Note that this ID should not be exposed normally. If unknown, use `null`.
- "subgraphHostedAccountName": Legacy hosted subgraph account name. Value is `"hoprnet"`.
- "useSafeStake": If "Safe Staking" should be considered. If `false`, `S_i === 0` and `F_i === 0`. This value should be set to `true`,
- "useChannelStake": If tokens staked in outgoing channels should be considered. If `false`, `S_i === 0`. This value should be set to `true`,
- "useHoprOnGnosis": If tokens on Gnosis chain should be considered. If `false`, `B2 === 0` and `B_i === 0`. This value should be set to `true`.
- "useHoprOnMainnet": If tokens on Ethereum mainnet should be considered. If `false`, `B1 === 0`. This value should be set to `true`.

- "subgraphStudioProdSafeStakeQueryId": ID of the "safe stake" subgraph in production. E.g. "DrkbaCvNGVcNH1RghepLRy6NSHFi8Dmwp4T2LN3LqcjY".
- "subgraphStudioDevSafeStakeSubgraphName": Name of the safe stake subgraph in Graph Studio. E.g. "hopr-nodes-dufour".
- "subgraphStudioDevSafeStakeVersion": Latest development version of the safe stake subgraph. E.g. "latest".
- "subgraphHostedSafeStakeSubgraphName": Name of the safe stake subgraph in Graph Hosted service. This servie does not exist, so the value should be `null`.
- "subgraphStudioProdChannelsQueryId": ID of the "channels" subgraph in production. E.g. "Feg6Jero3aQzesVYuqk253NNLyNAZZppbDPKFYEGJ1Hj".
- "subgraphStudioDevChannelsSubgraphName": Name of the channels subgraph in Graph Studio. E.g. "hopr-channels".
- "subgraphStudioDevChannelsVersion": Latest development version of the channels subgraph. E.g. "latest".
- "subgraphHostedChannelsSubgraphName": Name of the channels subgraph in Graph Hosted service. This servie does not exist, so the value should be `null`.
- "subgraphStudioProdHoprOnGnosisQueryId": ID of the HOPR token balances on Gnosis subgraph in production. Value should be `"njToE7kpetd3P9sJdYQPSq6yQjBs7w9DahQpBj6WAoD"`.
- "subgraphStudioDevHoprOnGnosisSubgraphName": Name of the HOPR token balances on Gnosis subgraph in Graph Studio. Value should be "hopr-on-gnosis"`
- "subgraphStudioDevHoprOnGnosisVersion": Latest development version of the HOPR token balances on Gnosis subgraph. E.g. "v0.0.2"`
- "subgraphHostedHoprOnGnosisSubgraphName": Name of the HOPR token balances on Gnosis in Graph Hosted service. Value should be `"hopr-on-xdai"`
- "exponent": Quadratic Voting-like exponent value. E.g., for quadratic-voting, the exponent is 0.5. This value can be set by the community to any value between 0 and 1, inclusive. Currently it is set at `"0.75"`.
