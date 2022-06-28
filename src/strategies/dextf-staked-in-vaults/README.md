# Multiple contract call strategy

This strategy allows users to call the 'balanceOf' function across multiple DEXTF contracts (vaults) and performs summation over the results. By calling 'balanceOf', DEXTF vaults return the amount of $DEXTF staked by the user in that vault. This strategy will make a single multicall which will retrieve all users' staked balances in all of DEXTF vaults.

## Example

The space config will look like this:

```JSON
{
  "strategies": [
    ["dextf-staked-in-vaults", {
      // vault contracts across which token balance needs to be calculated
      "contractAddresses": [
      "0x42a05787584ec09dDDe46f8CE6a715c93049ee88"
      ],
      // scoreMultiplier can be used to increase users' scores by a certain magnitude
      "scoreMultiplier": 1,
      // ABI for balanceOf method
      "methodABI_1": {
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
          }
    }],
  ]
}
```
