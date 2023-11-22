This strategy returns the voting power of an address that has staked sail in the vesail staking contract (https://etherscan.io/token/0x26fe2f89a1fef1bc90b8a89d8ad18a1891166ff5). The voting power is calculated as the amount of vesail held multiplied by the current exchange
rate of vesail to sail. Lastly it will take the result and apply a square root operation.

```JSON
{
  "strategies": [
    ["clipper-staked-sail"]
  ]
}
```