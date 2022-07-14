# ejs-staking

Stategy for Enjinstarter staking pools

## Stategy
- Timestamp of block number and network configured in proposal will be used to get block number on other networks for cross chain computation
- Stake in every pool and network specified in settings will be queried for every address
- Custom data can be added to support legacy staking pools
- For each address, each stake in each pool is first check to sure stake has not been suspended
- Each stake in each pool is then checked to make sure stake has not matured by the vote end date
- Stake from different pools will be grouped and added up according to the staking pool settings
- Stake will be checked for minimum token amount
- Vote will then be calculated based on lot size
- Votes from each pool will be added up to get final vote amount

## Parameters

See examples.json for sameple parameters.

| Parameter                     | Type   | Required | Description                                       |
| ----------------------------- | ------ | -------- | ------------------------------------------------- |
| stakingServiceContractAddress | string | true     | Contract address of staking service               |
| voteEndDate                   | string | true     | End date for proposal voting (ISO8601 format)     |
| decimals                      | number | false    | Decimal places for calculated vote                |
| stakingPoolSettings           | array  | true     | [Staking Pools Settings](#staking-pools-settings) |
| legacyData                    | array  | true     | [Legacy Data Pool Settings](#legacy-data)         |

## Staking Pools Settings

Pools configured under the same staking pool settings array will be grouped together during vote calculation.

| Parameter           | Type   | Required | Description                                     |
| ------------------- | ------ | -------- | ----------------------------------------------- |
| pools               | array  | true     | [Staking Pool Settings](#staking-pool-settings) |
| lotSizePerVote      | string | true     | Lot size per vote                               |
| minimumTokensToVote | string | true     | Minimum tokens to vote                          |

## Staking Pool Settings
| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| networkId | string | true     | Network id  |
| poolId    | string | true     | Pool id     |

## Legacy Data
| Parameter              | Type   | Required | Description                                      |
| ---------------------- | ------ | -------- | ------------------------------------------------ |
| address                | string | true     | Wallet address                                   |
| networkId              | string | true     | Network id                                       |
| poolId                 | string | true     | Pool id                                          |
| stakeAmountWei         | string | true     | Staked amount in wei                             |
| stakeMaturityTimestamp | string | true     | Stake maturity timestamp                         |
| isSuspended            | string | false    | If user is suspended in the pool (default false) |
