# GATENet Total Staked Strategy

A custom GATENet Total Staked Strategy to calculate total staked (voting power) for a wallet's address on the GATENet Staking Platform (https://staking.gatenet.io/).

```json
{
  "address": "0x6b175474e89094c44da98b954eedeac495271d0f",
  "symbol": "GATE",
  "decimals": 18,
  "minBalance": 10000
}
```
### Definitions
- Address → Smart Contract Address
- Symbol → Symbol of token
- Decimals → Number of decinals of the token
- Minimum Balance → Minimum balance / staked tokens required to vote. 
If staked value is <= minBalance it will result 0 (zero) voting power.

