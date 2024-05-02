# Split Delegation

A general-purpose delegate registry.

## Features

- Delegate to multiple addresses (specify the percentage of your vote-weight for each).
- Cascading delegations (Delegate A -> Delegate B -> Delegate C = Delegate C's total voting power = A + B + C)
- Expiring delegations
- Automatic vote weight adjustment based on token balance changes.
- Delegation revocation at any time.
