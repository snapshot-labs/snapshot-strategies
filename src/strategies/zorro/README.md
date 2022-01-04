# Zorro Proof of Personhood

- Returns `1` or `0` depending on whether the voter's address has proven to be a unique person within your Snapshot space using Zorro (https://zorro.xyz). No matter how many Ethereum addresses someone creates, Zorro aims to make it so only one of them can receive a `1` from this strategy within a given `purposeIdentifier`.
- Takes an optionl arg `purposeIdentifier`. By default, `purposeIdentifier` is your snapshot space id (e.g. yourspace.eth). If you want to, you can override this parameter by setting a param.

## Example parameters

#### Omit `purposeIdentifer` to use the default of your space's ens name

```json
{}
```

#### Custom `purposeIdentifier`

```json
{
  "purposeIdentifier": "YourDaoName"
}
```

## Customization

If you want a proof-of-personhood strategy customized for your purposes, just email ted@suzman.net and I'll be happy to help.
