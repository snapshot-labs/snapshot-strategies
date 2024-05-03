# Delegate Registry v2

A general-purpose delegate registry.

In order to utilize this, the 'Strategy Zero Gated' validation strategy is necessary. This is to prevent the delegator from also using the votes that have been delegated.

This strategy:

- returns a score of 0 for addresses that are delegating to other addresses (PS: addresses that return a score of 0 should not be allowed to vote),
- returns a score greater than 0 for addresses that are delegated to and are not delegating (PS: only the amount delegated to the address is returned; this needs to be merged with the scores from other strategies in the space to get the addresses total score),
- returns nothing for addresses that are not delegating to other addresses or delegated to.
