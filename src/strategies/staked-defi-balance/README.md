# staked-defi-balance

This custom strategy returns the score of addresses based on their staked token balance in a specific Ferrum Network DeFi staking pool contract.

Here is an example of parameters:

```json
{
                "tokenContractAddress": "0xe685d3CC0be48BD59082eDe30C3b64CbFc0326e2",
                "symbol": "cFRM",
                "decimals": 18,
                "minStakedBalance": "100000000000000000000000",
                "stakingPoolContractAddress": "0xb4927895cbee88e651e0582893051b3b0f8d7db8",
                "methodABI": [
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "id",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "staker",
                                "type": "address"
                            }
                        ],
                        "name": "stakeOf",
                        "outputs": [
                            {
                                "internalType": "uint256",
                                "name": "",
                                "type": "uint256"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    }
                ]
            }
```

Release Notes
-------------

### New Strategy: Staked Defi Balance

In this update, we have added a new strategy called `Staked Defi Balance` to the snapshot-strategies repository. This custom strategy allows users to calculate the scores of addresses based on their staked token balance in a specific staking pool contract.

#### Changes

1.  New Strategy File: A new file named `index.ts` has been added to the `src/strategies/staked-defi-balance` directory. This file contains the implementation of the `Staked Defi Balance` strategy, including multicall functionality to fetch staking balances and score calculation logic.

2.  Examples File: A new `examples.json` file has been added to the `src/strategies/staked-defi-balance` directory. This file demonstrates how to use the new strategy with the correct parameters, such as `tokenContractAddress`, `symbol`, `decimals`, `minStakedBalance`, `stakingPoolContractAddress`, and `methodABI`.

3.  Schema File: A new `schema.json` file has been added to the `src/strategies/staked-defi-balance` directory. This file defines the JSON schema for the strategy parameters, ensuring that they follow the correct structure and data types. The schema enforces the required parameters and validates their format.

#### Impact

This update expands the capabilities of the snapshot-strategies repository by providing a new strategy for users to calculate scores based on staked token balances. This strategy can be helpful for governance proposals and voting mechanisms that involve staked tokens in a specific staking pool contract.

#### Usage

To use this strategy, include it in your Snapshot configuration and provide the necessary parameters as shown in the `examples.json` file. Make sure the parameters follow the structure defined in the `schema.json` file for proper validation.

Please make sure to update your Snapshot configuration to include the new strategy and follow the release notes for any future updates or changes.