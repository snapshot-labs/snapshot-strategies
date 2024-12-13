# vesting-balance-of

This strategy retrieves vested balance for specific wallets on a custom developed vesting contract.
An example of this contract can be found on [etherscan](https://etherscan.io/address/0xE14885C5d632Abff9c04AEEf8e5fb88C0F6872DA).

The contract stores a list of vestings which is accessible via a `vestingPropertiesList()` method allowing to retrieve a 
full list of vestings without direct reference to users. A second method allows to retrieve the link of a user to a specific
vesting via `userPropertiesList(address wallet)` using the wallet's address as parameter.

With this strategy up to **5** buckets can be checked at once. Only one bucket is required. If multiple buckets are checked
the total balance is returned. 
*Decimals* is a global setting being applied to all buckets.

Here is an example of parameters:

```json
{
  "vesting_1": "0xE14885C5d632Abff9c04AEEf8e5fb88C0F6872DA",
  "vesting_2": "0x4fc18B68960A6ED7eab07451f0d755D857FF329d",
  "vesting_3": "0x955866b5a5E8aa8619aC09C422046095654414da",
  "vesting_4": "0x6b175474e89094c44da98b954eedeac495271d0f",
  "vesting_5": "0x6b175474e89094c44da98b954eedeac495271d0f",
  "decimals": 18
}
```
