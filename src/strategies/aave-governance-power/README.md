# Contract call strategy

Allows to get Voting power or Proposition power from an Aave GovernanceStrategy contract.

## Strategy Parameters

| Param              | Type   | Description                                                                                                                |     |     |
| ------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------- | --- | --- |
| governanceStrategy | string | The Ethereum address of the GovernanceStrategy contract to measure voting or proposition power from an address at a block. |     |     |
| powerType          | string | Use `vote` for Voting Power or `proposition` for Proposition Power                                                         |     |     |
|                    |        |                                                                                                                            |     |     |

## Params

| Param | Type   | Description |
| ----- | ------ | ----------- |
| governanceStrategy | string | The Ethereum address of the GovernanceStrategy contract to measure voting or proposition power from an address at a block. |
| powerType | string | Use `vote` for Voting Power or `proposition` for Proposition Power |
| decimals | number | The decimals of the governance token |
| symbol | string | The symbol of the governance token |
