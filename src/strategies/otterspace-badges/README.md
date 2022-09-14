# Otterspace Badges

- A RAFT is an NFT that represents a community (or a DAO) within Otterspace.
- A RAFT has several badge specs under it. A badge spec is the design of a badge, which is essentially described as ERC721 metadata standard.
- Each BADGE is a non-transferable token built with [ERC4973]("https://github.com/otterspace-xyz/ERC4973") spec and maximally backwards compatible with ERC721. Each badge spec may have several badges associated which indicate the badges minted for that spec that is associated to a raft

The parameters that must be specified when using this strategy are as follows

- A RAFT token ID
- The RAFT's contract address
- An array of weights associated to the badge specs

If no specs are specified, all badges under the RAFT are considered equal with the weight of 1

Here is an example of its usage:

```json
{
  "symbol": "BADGES",
  "raftTokenId": "1",
  "raftAddress": "0xa6773847d3D2c8012C9cF62818b320eE278Ff722",
  "specs": [
    {
      "id": "bafyreicmofif36f2s4d2iv37gy532epnw7rwjf5rygdhzzh2iw6nmbunrq",
      "weight": 5
    },
    {
      "id": "bafyreihj2e3mxqwk24auglrfckk3eh2hzsq7eyghjpcprmopvok5wxz3bu",
      "weight": 10
    }
  ]
}
```
