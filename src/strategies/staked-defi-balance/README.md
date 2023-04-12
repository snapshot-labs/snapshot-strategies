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
