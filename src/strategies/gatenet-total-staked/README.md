# GATENet Total Staked Strategy

A custom GATENet Total Staked Strategy to calculate quorum based on the total staked for a wallet's address, based on the GATENet Staking Platform (https://staking.gatenet.io/).

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
- Symbol → Symbol of currency
- Decimals → Decimal to round 18 = 1e18
- Minimum Balance → Minimum balance / staked token to vote. 
If staked value is <= minBalance it will result 0 (zero) voting power.

