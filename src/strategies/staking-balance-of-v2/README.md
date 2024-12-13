# staking-balance-of-v2

This strategy retrieves staked balance for specific wallets on a custom developed staking contract.
An example of this contract can be found on [etherscan](https://etherscan.io/address/0x59Ca57ca0f03c6E383a2d8dfE4c73c21174e7c8A) and is referenced as "Staking V2".
This contract also support multiple stakes by the same user on the same pool, all being handled individually.

The contract stores a list of staking buckets which is accessible via a `getUserInfo(uint256 pid, address wallet)` method allowing to retrieve
information about the user's staked amount. In contrast to the `v1` strategy and its supported contract, the administrative information is removed
from the contract for better performance.
Another method provided by the contract (`getPoolInfo(uint256 pid)`) returns information on the pool itself. The information will be used to calculate
the weight of a user's stake on the contract - in general, longer pool lockups are considered more valuable than shorter lockups.

With this strategy up to **3** buckets can be checked at once. Only one bucket is required. If multiple buckets are checked
the total balance is returned.
*Decimals* is a global setting being applied to all buckets.

Here is an example of parameters:

```json
{
  "staking_contract": "0x59Ca57ca0f03c6E383a2d8dfE4c73c21174e7c8A",
  "pid_1": "1",
  "pid_2": "2",
  "pid_3": "3",
  "decimals": 18,
  "maxTimeInPool": "63072000"
}
```
