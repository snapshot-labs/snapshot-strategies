# pdn-balances-and-vests

## Calculating Vested Tokens with Balances

To find out the total number of vested tokens with balances, follow these steps:

1. Invoke the `balanceOf` function for each address to get its token balance.
2. Use the `getVestLength` function to determine the number of vests held by that address.
3. Invoke the `getVestMetaData` function to retrieve metadata for each vest, including the amount vested.
4. Add the amount vested for each vest to the total balance for the corresponding address.

Here is an example of parameters:

```json
{
  "address": "0xdd0d06EC5dB655f76641bdA81Fec3221C167787e",
  "symbol": "PDN",
  "decimals": 18
}
```
