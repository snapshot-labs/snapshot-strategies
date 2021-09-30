# Multiple contract call strategy

This strategy allows users to call a function like 'balanceOf' across multiple contracts and performs summation over the results. By calling 'balanceOf', Dfyn vaults return the amount of Dfyn staked by the user in that vault. This strategy will make a single multicall which will retrieve all users' staked balances in all of Dfyn's vaults. 

## Example

The space config will look like this:

```JSON
{
  "strategies": [
    ["anyan-staked-in-vaults", {
      // vault contracts across which token balance needs to be calculated
      "contractAddresses": [
      "0x64C298717491D7Be71C1DFf80F4B3b651a25A687", 
  
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
