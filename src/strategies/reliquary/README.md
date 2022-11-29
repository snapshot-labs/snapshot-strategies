# reliquary

This strategy utilizes Relic NFTs from Reliquary to calculate voting power. The strategy can be configured to either
use the level number to weight the voting power or the allocation points assigned to each level.

If we use the levels strategy, the formula to calculate the voting power is

`votingPower = level / maxVotingLevel * amount`

or if we use allocation points

`votingPower = levelAllocationPoint / maxLevelAllocationPoint * amount`

In other words, if the nft has reached max voting level the voting power is equal to the amount deposited.

Since Relic levels only update on an interaction, we have to chose if we want to use the current 'actual' level, or the level which the relic would
have after an update. This can be done using the `useLevelOnUpdate` flag.

Configuration:
| property | type | value | description |
|------|---|---|---|
| reliquaryAddress | string | 0x12345... | address of reliquary contract
| poolId | number | 0...n | pool ID used for voting
| minVotingLevel | number | 0...n | min level required to vote
| maxVotingLevel | number | 0...n | max voting level
| decimals | number | 6..18 | number of decimals of the token deposited into this pool
| strategy | string | 'level' / 'allocation' | which strategy to use to weight voting power
| useLevelOnUpdate | boolean | true / false | use hypothetical level after update

```json
{
  "reliquaryAddress": "0xb0fc43069089d0fa02baaa896ac2efcb596d7d05",
  "poolId": 1,
  "minVotingLevel": 1,
  "maxVotingLevel": 7,
  "decimals": 18,
  "strategy": "allocation",
  "useLevelOnUpdate": false
}
```
