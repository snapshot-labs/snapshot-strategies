# Spirit strategy

Allows any contract method to be used to calculate voter scores from InSpirit.

## Examples

Can be used instead of the erc20-balance-of strategy, the space config will look like this:

```JSON
   "strategy": {
        "name": "spirit",
        "params": {
            "address": "0x2FBFf41a9efAEAE77538bd63f1ea489494acdc08",
            "symbol": "InSpirit",
            "decimals": 18,
            "methodABI": {
                "inputs": [{
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                }],
                "name": "balanceOf",
                "outputs": [{
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }],
                "stateMutability": "view",
                "type": "function"
            }

        }
    },
```

You chould only put an address as argument.
 -> If it is a contract and his InSpirit balance is higher than 0, then will respond with the owner contract and the InSpirit Balance from the contract itself.

 -> If it is a contract and his InSpirit balance is 0, then will show the contract address and the balance equal to 0.

 -> If it is a address and his InSpirit balance is 0, then will show the address and the balance equal to 0.

 -> If it is a address and his InSpirit balance is higher than 0, then will respond with the address and his InSpirit Balance.

```

