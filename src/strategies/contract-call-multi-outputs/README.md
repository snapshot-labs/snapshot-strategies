# Contract call multi outputs strategy

Allows any contract method with multi-outputs to be used to calculate voter scores.

## Examples

Get User's CakeVault Balance in the MasterChef Contract , the space config will look like this:

```JSON
{
  "strategies": [
    {
      "name":"contract-call-multi-outputs",
      "params": {
        "address": "0x73feaa1eE314F8c655E354234017bE2193C9E24E",
        "symbol": "Cake",
        "decimals": 18,
        // arguments are passed to the method; "%{address}" is replaced with the voter's address; default value ["%{address}"]
        "args": [0, "%{address}"], 
        "output":"amount",
        "methodABI": {
            "inputs": [
                {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
                },
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
                "name": "amount",
                "type": "uint256"
                },
                {
                "internalType": "uint256",
                "name": "rewardDebt",
                "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    }
  ]
}
```
