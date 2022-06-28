# Decentraland Wearable Rarity

This strategy allows users to calculate the total amount of Decentraland wearables and apply a multiplier to each rarity. Additionally you can limit the collections that will be taken into account using a list of ids.

## Example

The parameters should look like this:

```json
{
    "symbol": "WEARABLE",
    "multipliers": {
        "unique": 1000000,
        "mythic": 100000,
        "legendary": 10000,
        "epic": 1000,
        "rare": 100,
        "uncommon": 10,
        "common": 1
    }
}
```

If you want to restrict which collection is taken into account, parameters should look like this:

```json
{
    "symbol": "WEARABLE",
    "collections": [
        "0x32b7495895264ac9d0b12d32afd435453458b1c6",
        "0xd35147be6401dcb20811f2104c33de8e97ed6818",
        "0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd",
        "0xc1f4b0eea2bd6690930e6c66efd3e197d620b9c2",
        "0xf64dc33a192e056bb5f0e5049356a0498b502d50",
        "0xc3af02c0fd486c8e9da5788b915d6fff3f049866"
    ],
    "multipliers": {
        "unique": 1000000,
        "mythic": 100000,
        "legendary": 10000,
        "epic": 1000,
        "rare": 100,
        "uncommon": 10,
        "common": 1
    }
}
```
