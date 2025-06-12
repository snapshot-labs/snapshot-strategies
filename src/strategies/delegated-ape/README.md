# Delegated APE

This strategy calculates voting power based on gas token balance with delegation support.

If a user has delegated their voting power to someone else, their own balance is not counted toward their voting power.

## Parameters

| Parameter | Description | Required |
| --------- | ----------- | -------- |
| `delegationContract` | Address of the delegation contract | Yes |
| `delegationId` | Delegation ID (bytes32) to query | Yes |
| `symbol` | Symbol to display | No |

## Example Configuration

```json
{
  "delegationContract": "0xDd6B74123b2aB93aD701320D3F8D1b92B4fA5202",
  "delegationId": "0x0000000000000000000000000000000000000000000000000000000000000001",
  "symbol": "APE"
}
```
