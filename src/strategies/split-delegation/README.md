# Split Delegation

A general-purpose delegate registry.

## Features

- Delegate to multiple addresses (specify the percentage of your vote-weight for each).
- Cascading delegations (Delegate A -> Delegate B -> Delegate C = Delegate C's total voting power = A + B + C)
- Expiring delegations
- Automatic vote weight adjustment based on token balance changes.
- Delegation revocation at any time.

## Setting it up

Mimic the structure found in `./examples.json`, with your required substrategies in an array on the `strategies` field. The other required field is `totalSupply`. This field should represent the total amount of tokens to be used as the denominator for your voting strategies, used to calculate the percent of voting power each member of your space controls. This is most often the total supply of your token, or the sum of the total supplies of the various tokens you are using.
