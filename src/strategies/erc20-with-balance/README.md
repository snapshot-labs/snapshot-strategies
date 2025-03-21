# with-balance

> Important Note: This strategy works for ERC721 contract too.

This strategy checks if the voter has a balance of the token in the contract. returns `1` if the voter has a balance of the token in the contract. else returns `0`.

## Parameters

| Param Name      | Description |
| ----------- | ----------- |
| address      | Address of the contract  |
| symbol (optional)   | symbol  |
| decimals (optional)   | decimals  |
| minBalance (optional)   | Minimum balance check (Note that this value is exclusive, For example if you pass `1`, balance should be more than `1`) Default is `0` |

Here is an example of parameters:

```json
{
    "address": "0x84cA8bc7997272c7CfB4D0Cd3D55cd942B3c9419",
    "symbol": "DIA",
    "decimals": 18,
    "minBalance": 10
}
```
