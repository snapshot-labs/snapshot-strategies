# battlefly-vgfly-and-staked-gfly

This strategy calculates the voting power for addresses with one or more of the following requirements:

* An amount of unvested tokens
* An amount of staked tokens
* An amount of staked LP tokens
* An amount of staked founder tokens

As input a graphUrl is required which will return those amounts for each queried address.
Additionally, the gFLY, magic vgFLY and LP token addresses are required for some on-chain calls that are not possible with Subgraph.

```json
{
  "graphUrl": "https://api.thegraph.com/subgraphs/name/battlefly-game/gfly-main",
  "gFLYAddress": "0x872bAD41CFc8BA731f811fEa8B2d0b9fd6369585",
  "magicAddress": "0x539bdE0d7Dbd336b79148AA742883198BBF60342",
  "lpAddress": "0x088F2Bd3667F385427d9289C28725D43d4b74AB4",
  "v1FoundersVault": "0x2F67932136D84De27D99Ed89a423b907A1b10930",
  "v2FoundersVault": "0x6c9CC5a6d5484CB8eAB1438632BBf667A5E25eD9",
  "foundersToken": "0xc43104775BD9f6076808B5F8dF6CbdBeac96d7dE",
  "vgFLYAddress": "0x86d643b7f4a2a6772A4B1bFBee5EcE46A1DE3dfD",
  "symbol": "gFLY",
  "decimals": 18
}
```
