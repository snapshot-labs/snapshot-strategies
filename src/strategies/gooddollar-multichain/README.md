# max eth fuse

** This strategy is limited to networks 1 and 122 and allows at most 2 sub strategies**

This is similar to the multichain strategy only that it chooses the chain with max voting power.

Here is an example of parameters:

In the below example, the tokens on etherem and fuse are queried and the max value denotes the voting power

```json
{
  "symbol": "GOOD",
  "strategies": [
    {
      "name": "contract-call",
      "network": "122",
      "params": {
        "symbol": "GOOD",
        "address": "0x603b8c0f110e037b51a381cbcacabb8d6c6e4543",
        "decimals": 18,
        "methodABI": {
          "name": "getVotes",
          "type": "function",
          "inputs": [
            {
              "name": "voter",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        }
      }
    },
    {
      "name": "contract-call",
      "network": "1",
      "params": {
        "symbol": "GOOD",
        "address": "0x603b8c0f110e037b51a381cbcacabb8d6c6e4543",
        "decimals": 18,
        "methodABI": {
          "name": "getVotes",
          "type": "function",
          "inputs": [
            {
              "name": "voter",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "uint256",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        }
      }
    }
  ]
}
```
