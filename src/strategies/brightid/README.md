# BrightID

This strategy return a score of 1 for voters verified in a BrightID user registry. You can learn more about the smart contract used on this strategy from the following sources:

- Official Registry(v5): https://github.com/BrightID/BrightID-SmartContract/blob/v5/snapshot/BrightIDSnapshot.sol
- Private Registry: https://github.com/clrfund/monorepo/tree/develop/contracts/contracts/userRegistry

Here is an example of parameters for using an official registry contract:
Note that when using an official registry, the network is always set to IDChain(74).

```json
{
  "registry": "v5",
  "symbol": "verified"
}
```

Here's a list of all official registry contracts currently deployed on IDChain:

- v5(https://explorer.idchain.one/address/0x81591DC4997A76A870c13D383F8491B288E09344/contracts)

To provide users with a better experience, a custom built frontend site is recommended for interacting with official / private registry contracts.

e.g. Frontend for official v5 registry built by SongADAO (https://github.com/SongADAO/songaday-brightid-registration)

In the example below, an alternative private registry contract is used:
Note that when using a private registry, the network is set to the space's network.

```json
{
  "registry": "0xF99e2173db1f341a947CE9Bd7779aF2245309f91",
  "symbol": "verified"
}
```

A private registry would need to implement a similar logic to the official registry, while also implementing the following function:

```
function isVerifiedUser(address _user) external view returns (bool)
```

Where when passed in an address `_user`, the contract would return a boolean value representing the address' verification status.
