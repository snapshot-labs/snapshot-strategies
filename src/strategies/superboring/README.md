# SuperBoring

Returns the $BORING amount associated to the voter, consisting of 3 components
* tokens directly held
* tokens held by the associated _SleepPod_
* sum of tokens staked on Torexes controlled by the SuperBoring instance

The _SleepPod_ is a contract holding tokens on behalf of users. Each account can have zero or one SleepPod associated.

In order to calculate the amount of staked tokens, the strategy first gets a list of _Torexes_ from the SuperBoring contract,
then queries the stake amount of the voter for each of them, and sums them up.

Here is an example of parameters for Celo:

```json
{
  "tokenAddress": "0x6C210F071c7246C452CAC7F8BaA6dA53907BbaE1",
  "superBoringAddress": "0xAcA744453C178F3D651e06A3459E2F242aa01789"
}
```

For more details about SuperBoring, visit https://docs.superboring.xyz