# vDfyn contract call strategy

This strategy allows users to calculate the total amount of Dfyn staked by the user in the vDfyn vault.

## Example

The space config will look like this:

```JSON
{
  "strategies": [
    ["balance-in-vdfyn-vault", {
      // vDfyn vault contract
      "contractAddress": "0x75455c3DE45dD32CBE9a5aD5E518D3D50823c976",
      // scoreMultiplier can be used to increase users' scores by a certain magnitude
      "scoreMultiplier": 2,
      // ABI for balanceOf method
      "methodABI": [
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "account",
                                "type": "address"
                            }
                        ],
                        "name": "balanceOf",
                        "outputs": [
                            {
                                "internalType": "uint256",
                                "name": "",
                                "type": "uint256"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [],
                        "name": "ratio",
                        "outputs": [
                            {
                                "internalType": "uint256",
                                "name": "dfynAmount_",
                                "type": "uint256"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    }
                ]
    }],
  ]
}
```
