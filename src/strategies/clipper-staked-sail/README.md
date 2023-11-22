# AdmiralDao Staked Sail

This strategy returns the voting power of an address that has staked sail in the vesail staking contract [VeSail](https://etherscan.io/token/0x26fe2f89a1fef1bc90b8a89d8ad18a1891166ff5). 
The voting power is calculated as:
- The amount of vesail held in their address. 
- Then applies that to the tosail method in the contract.
- Lastly it will take the result and apply a square root operation.

```JSON
{
  "strategies": [
    ["clipper-staked-sail"]
  ]
}
```
