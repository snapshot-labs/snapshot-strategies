# Zorro Proof of Personhood

This strategy distributes voting power democratically using the Zorro Proof of Personhood protocol (https://zorro.xyz).

- The voting power of an address is `0` if they have not been proven as a unique person within your Snapshot space. If they are proven unique, then their voting power is given by the `power` parameter (which defaults to `1`).

- No matter how many Ethereum addresses someone creates, Zorro aims to make it so only one of them can receive a non-zero voting power from this strategy for a given `purposeIdentifier` (which defaults to your space's ENS name).

## Example options parameters

#### Minimal example

```json
{
  "symbol": "VOTES"
}
```

In the above example, `purposeIdentifier` defaults to your space's ens name (e.g. `yourdao.eth`), and `power` defaults to `1`.

#### options

```json
{
  "symbol": "VOTES",
  "purposeIdentifier": "YourDaoName",
  "power": 1000
}
```

## Customization

If you want a proof-of-personhood strategy customized for your purposes, just email ted@suzman.net and I'll be happy to help.
