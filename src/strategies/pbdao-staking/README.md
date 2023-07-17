# PB DAO stakers and holders strategy

This strategy return the balances of the voters for PB DAO project from staking pool.

## Accepted options

- **staking:** PB DAO staking pool address.

## Examples

```JSON
[
  {
    "name": "PBDAO Staker and Holders",
    "strategy": {
      "name": "pbdao-staking",
      "params": {
        "staking": "0x0A44B248C871dEcFcC46427207543e39f5234590",
        "symbol": "PBDAO",
        "decimals": 0
      }
    },
    "network": "1",
    "addresses": [
      "0xcb5C730A85795b20C1fdB543B64B2ED164333803",
      "0x4252a493899D1E2D1573Ff4084446C095C75055E",
      "0x24d19f100ba142543a863fc2294b188e35ab55b9"
    ],
    "snapshot": 13439719
  }
]




```
