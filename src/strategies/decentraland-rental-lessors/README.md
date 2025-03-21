# Decentraland Rental Lessors

This strategy allows calculating the VP of Land/Estate owners after ownership is transferred to the Rentals contract.

Thanks to this, the VP that the user had before utilizing the rentals feature will not be lost.

## Example

The following example params are for obtaining the VP users have after sending their Lands/Estates to the Rentals contract in the Goerli network.

```json
{
  "subgraphs": {
    "rentals": "https://api.studio.thegraph.com/query/49472/rentals-ethereum-sepolia/version/latest",
    "marketplace": "https://api.studio.thegraph.com/query/49472/marketplace-sepolia/version/latest"
  },
  "addresses": {
    "estate": "0xc9a46712e6913c24d15b46ff12221a79c4e251dc",
    "land": "0x25b6b4bac4adb582a0abd475439da6730777fbf7"
  },
  "multipliers": {
    "estateSize": 2000,
    "land": 2000
  }
}
```

The land multiplier determines how much VP is given by each Land the address possesses in the Rentals contract. For example, if the user has 5 Lands in the Rentals contract, it will be given 5 \* 2000 VP.

The estateSize multiplier determines how much VP is given to the original owner according to the size of their Estates currently on the Rentals contract. For example, if the address has 1 Estate in the Rentals contract composed of 5 Lands, the user will be given 5 \* 2000 VP as well.
