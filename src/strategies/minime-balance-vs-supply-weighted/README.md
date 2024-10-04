# minime-balance-vs-supply-weighted

This strategy returns the percent of the total supply of a token that is held by voters in a snapshot multiplied by a weight. It is tailored to be used by a minime token contract but could be used by any token contract that has a function that can return the total/current supply of the given token. It additionaly can have a weight added to it.

First this function will call the specific token contract by the input ABI view-only function (no args), it will save the response. After that it follows a standard erc20-balance-of-weighted strategy (h/t Tanz0rz) to get the token balance. We divide the balance by the total supply then multiply it by the weight to arrive at the final voting power.

Here is an example of parameters:

```json
{
   "address": "0x16ef294ed9aeca7541183f19e4a5d01cebab88fb",
        "symbol": "REP",
        "decimals": 18,
        "weight": 0.5,
        "methodABI": {
          "constant": true,
          "inputs": [],
          "name": "totalSupply",
          "outputs": [
            {
              "name": "",
              "type": "uint256"
            }
          ],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        }
}
```
