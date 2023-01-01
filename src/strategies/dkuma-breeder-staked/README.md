# erc20-balance-of

Strategy for the Kuma DAO. Gets the staked dKUMA in the dKuma Breeder assinged to a certain wallet.

```json
{
  "dbreeder": {
    "address": "0x82a3D73B983396154Cff07101E84d7d339C4f0E3",
    "abi": {
      "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
      "name": "stakeInfo",
      "outputs": [
        { "internalType": "uint256", "name": "amount", "type": "uint256" },
        { "internalType": "uint256", "name": "enteredAt", "type": "uint256" },
        { "internalType": "uint256", "name": "rewardTaken", "type": "uint256" },
        { "internalType": "uint256", "name": "rewardTakenActual", "type": "uint256" },
        { "internalType": "uint256", "name": "bag", "type": "uint256" }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  },
  "decimals": 18
}

```
