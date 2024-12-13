# Split Delegation

A general-purpose delegate registry.

## Features

- Delegate to multiple addresses (specify the percentage of your vote-weight for each).
- Cascading delegations (Delegate A -> Delegate B -> Delegate C = Delegate C's total voting power = A + B + C)
- Expiring delegations
- Automatic vote weight adjustment based on token balance changes.
- Delegation revocation at any time.

## Setting it up

Mimic the structure found in `./examples.json`, and fill in the parameters.

Parameters:

- `strategies`
  - This field is an array of the snapshot strategies you want to use to calculate raw voting score.
- `totalSupply`
  - This field should represent the total amount of tokens to be used as the denominator for your voting strategies, used to calculate the percent of voting power each member of your space controls. This is most often the total supply of your token, or the sum of the total supplies of the various tokens you are using.
- `delegationOverride`
  - This field is optional, and defaults to `false`. If set to `true`, addresses who have delegated can still vote in a poll and have that vote counted with the weight associated with their account, overriding the vote of their delegate. If set to `false`, addresses that have delegated will not be able to override their delegate's vote. _*This should only be used for smaller spaces, as it requires more computation per vote*_
