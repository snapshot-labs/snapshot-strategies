# staking-balance-of-v1

This strategy retrieves staked balance for specific wallets on a custom developed staking contract.
An example of this contract can be found on [etherscan](https://etherscan.io/address/0x0a3476c1ea4ef65416016876c67e1a14e3575d73) and is referenced as "Staking V1".

The contract stores a list of staking buckets which is accessible via a `getUserInfo(uint256 pid, address wallet)` method allowing to retrieve 
information about the user's staked amount as well as other administrative information. The administrative information is irrelevant for this'
voting strategy's purpose. 
Another method provided by the contract (`getPoolInfo(uint256 pid)`) returns information on the pool itself. The information will be used to calculate
the weight of a user's stake on the contract - in general, longer pool lockups are considered more valuable than shorter lockups.

With this strategy up to **3** buckets can be checked at once. Only one bucket is required. If multiple buckets are checked
the total balance is returned. 
*Decimals* is a global setting being applied to all buckets.

Here is an example of parameters:

```json
{
  "staking_contract": "0x0a3476c1ea4ef65416016876c67e1a14e3575d73",
  "pid_1": "1",
  "pid_2": "2",
  "pid_3": "3",
  "decimals": 18,
  "maxTimeInPool": "63072000"
}
```
