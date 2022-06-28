# erc20-balance-of-contract-multiplier

This returns the balances of the voters for a specific ERC20 token with a multiplier obtained from a contract call.

Here is an example of parameters:

```json
{
  "address": "0xb352A324283a51259f74fc9133b56A582671c836",
  "symbol": "wTROVE",
  "decimals": 9,
  "contract_address": "0x4ef0191De9E85154161E6AD0E96fe0bb8D95892D",
  // Arguments passed to the method
  "args": [],
  "methodABI": {
    "inputs": [],
    "name": "index",
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
}
```
