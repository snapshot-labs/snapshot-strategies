# metropolis-pod

This strategy gives one voting power to each member of a specific Metropolis Pod NFT, specified by the ERC1155 Token ID - which can be found in the [Metropolis web app](https://pod.xyz) or in your wallet. 

## Parameters

| Param Name      | Description |
| ----------- | ----------- |
| id      | Token ID of the pod   |
| weight (optional)   | Multiplier of the voting power - Default is `1`  |

Here is an example of the parameters:

```json
{
  "symbol": "METRO",
  "id": "1",
  "weight": 100
}
```
