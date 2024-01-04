# Contract call view strategy

Allows any contract function to be used to calculate voter scores, even those one which return multiple values.

## Examples

Can be used instead of the `contract-call` strategy, the space config will look like this:

```JSON
{
  "strategies": [
    ["contract-call-view", {
      // contract address
      "address": "0x5cA0F33f1ebD140def87721291FF313A9141F79e",
      // decimals
      "decimals": 18,
      // index of value returned by function
      "outputIndexToReturn": "1",
      // ABI for view function
      "methodABI": {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "userInfo",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "lastStakeTime",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "waitingRewards",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
    }],
  ]
}
```