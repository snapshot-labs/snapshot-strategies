Strategy for using the "power" stat of Squadz collections for voting power.

Power factors in:
- if an address has a currently active membership
- how many memberships an address has been minted total

Parameters should look like:
```
{
  "symbol": "SQDZ", // the token symbol for your collection
  "collectionAddress": "0xd5746787be995887c59eff90611778b9cb67f0db", // the address for your collection
}
```

RARE: If your collection was forked onto the Squadz engine (see heyshell.xyz), you will also need to include the `forkNumber` in the parameters object.