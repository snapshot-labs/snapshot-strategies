# DCB Tiers Contract call strategy

Allows getTotalDeposit method to be used to calculate voter scores.

## Examples

Can be used instead of the erc20-balance-of strategy, the space config will look like this:

```JSON
{
  "strategies": [
    ["contract-call", {
      // token address
      "address": "0x8befB4b534e711A844AA9a10C3E7D00cbbAeBc66",
      // token decimals
      "decimals": 18,
      // ABI for balanceOf method
      "methodABI": {
          "inputs": [
            { "internalType": "address", "name": "addr", "type": "address" }
          ],
          "name": "getTotalDeposit",
          "outputs": [
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
          ],
          "stateMutability": "view",
          "type": "function"
        }
    }],
  ]
}
```
