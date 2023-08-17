# lodestar-vesting

Calculates voting power of locked & vesting ERC20 tokens. The indices of the beneficiary addresses and their vesting contract addresses MUST match in order to properly match beneficiaries with their associated vesting contracts.

Here is an example of parameters:

```json
{
  "address": "0xF19547f9ED24aA66b03c3a552D181Ae334FBb8DB",
  "symbol": "LODE",
  "decimals": 18,
  "beneficiaryAddresses": [
    "0x41C2F1Af5a4a4C65b580c1397141684F96B68aAb"
  ],
  "contractAddresses": [
    "0x658fD8f0e4380c9823C6a18974096A2b2aC8842e"
  ]
}
```
