# membership

This strategy allows you to combine any arbitrary "membership" strategy with any "voting power" strategy. The idea is that you can only vote if you pass the membership strategy. This is super useful to enable things like quadratic voting or other non plutocratic systems that require sybil resistance. For example, Compound could say that voting power is your COMP balance, but only if you also possess a [UID](https://etherscan.io/address/0xba0439088dc1e75F58e0A7C107627942C15cbb41) or a PUNK (`erc721` strategy). Or you must pass BrightID verification (`brightid` strategy). Or make your own verification strategy based on on-chain behavior! The sky is the limit!

Then you can use quadratic voting, or one-member-one-vote, or any other system you can think of. With a sense of identity, the design space for governance opens up significantly.

Note: The membership portion is binary. If the membership strategy returns any number > 0 for an address, then you're a member. Otherwise voting power for that address is zero.

Here is an example of parameters:

```json
  {
    "membershipStrategy": {
      "name": "erc721",
        "params": {
          "address": "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb"
        }
    },
    "votingPowerStrategy": {
      "name": "erc20-balance-of",
        "params": {
          "address": "0x6b175474e89094c44da98b954eedeac495271d0f",
          "symbol": "DAI",
          "decimals": 18,
        }
    },
    "symbol": "DAI"
  }
```
