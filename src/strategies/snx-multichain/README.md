# snx-multichain

This strategy calculates the voting power of addresses based on their collateral values across all Synthetix deployments. It queries the collateral values from the Synthetix v2x system as well as the v3 system on each network, and sums the results to determine the total voting power for each address.

Here is an example of the parameters used:

```json
{
  "symbol": "SNX",
  "strategies": [
    {
      "name": "contract-call",
      "network": "1",
      "params": {
        "address": "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F",
        "decimals": 18,
        "methodABI": {
          "name": "collateral",
          "type": "function",
          "inputs": [
            {
              "name": "account",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "uint",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        }
      }
    },
    {
      "name": "contract-call",
      "network": "10",
      "params": {
        "address": "0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4",
        "decimals": 18,
        "methodABI": {
          "name": "collateral",
          "type": "function",
          "inputs": [
            {
              "name": "account",
              "type": "address",
              "internalType": "address"
            }
          ],
          "outputs": [
            {
              "name": "",
              "type": "uint",
              "internalType": "uint256"
            }
          ],
          "stateMutability": "view"
        }
      }
    }
  ]
}
