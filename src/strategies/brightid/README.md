# BrightID

This strategy returns a score of 1 for voters verified in a BrightID user registry. You can learn more about the smart contract used on this strategy from the following sources:

- Public Registry(v5): https://github.com/BrightID/BrightID-SmartContract/blob/v5/snapshot/BrightIDSnapshot.sol
- Private Registry: https://github.com/clrfund/monorepo/tree/develop/contracts/contracts/userRegistry

Public registries are maintained by BrightID and can be used if a DAO has no interest on setting one up themselves.

Here is an example of parameters for using an public registry contract:
Note that when using an public registry, the network is always set to IDChain(74).

```json
{
  "registry": "v5",
  "symbol": "verified"
}
```

Here's a list of all public registry contracts currently deployed on IDChain:

- v5(https://explorer.idchain.one/address/0x81591DC4997A76A870c13D383F8491B288E09344/contracts)

To provide users with a better experience, a custom built frontend site is recommended for interacting with public / private registry contracts.

e.g. Frontend for public v5 registry built by SongADAO (https://github.com/SongADAO/songaday-brightid-registration)

In the example below, an alternative private registry contract is used:
Note that when using a private registry, the network is set to the space's network.

```json
{
  "registry": "0xF99e2173db1f341a947CE9Bd7779aF2245309f91",
  "symbol": "verified"
}
```

A private registry would need to implement a similar logic to the public registry, while also implementing the following function:

```
function isVerifiedUser(address _user) external view returns (bool)
```

Where when passed in an address `_user`, the contract would return a boolean value representing the address' verification status.
