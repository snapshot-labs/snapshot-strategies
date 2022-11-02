# REP3 Badges

The Proof of Contribution Protocol (or PoCP) is the beta version of rep3's credentialing protocol. The rep3 DAO tool (live at https://app.rep3.gg/) is one possible implementation of the protocol to facilitate better member and contribution management for DAOs.

Using the protocol, DAOs can give various types of badges to their members. These badges are organised in a parent-child relationship -- first, all members receive a membership badge (which is the parent badge), and then members can receive contribution badges (representing their work) or any other type of badge as designed by the community (for example, one-off badges to acknowledge exemplary work). The contribution badges and the custom badges are children to the membership badge.

This architecture lets communities track and visualise their member activity and, on the other hand, lets community members build their portfolio of work through on-chain credentials. These naturally have a higher signalling value than more traditional types of portfolios like resumés.

Badges given through the rep3 platform are also fully interoperable with several web3 tools, especially those that are used for gating resources behind a token. These badges, at a contract level, are custom implmentations of ERC-721 tokens. This is a deliberate decision to balance the trade-off between maintaining the integrity of these badges (w.r.t. the work they represent) and permitting key rotation by users.

The rest of this document details the technical specifications and integration process of our protocol. Please note that this document might be confusing to understand or even have some outdated parts. We are in the process of updating these as we begin to focus on protocol-level integrations in addition to focussing on tool adoption.

As always, do not hesitate at all to reach out to any team member in case you have a question. We usually reply within 12h and will be more than happy to address any questions you may have.

Have a great day ahead!

```json
{
  "symbol": "REP-3",
  "rep3ContractAddress": "0x959a3e7e2ea1ea56c9127ae9ed271ede495d145f",
  "erc20Token": "0x6b175474e89094c44da98b954eedeac495271d0f",
  "erc20Symbol": "DAI",
  "erc20Decimal": 18,
  "subgraphNetwork": 80001,
  "specs": [
    {
      "type": 0,
      "level": 1,
      "weight": 5
    },
    {
      "type": 0,
      "level": 2,
      "weight": 10
    },
    {
      "type": 0,
      "level": 3,
      "weight": 15
    },
    {
      "type": 0,
      "level": 4,
      "weight": 20
    },
    {
      "type": 1,
      "weight": 2
    }
  ]
}
```
