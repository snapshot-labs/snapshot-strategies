# Nayms Staking Strategy

This strategy calculates voting power based on staked NAYM tokens in the Nayms protocol. The voting power is determined by the boosted amount of a user's staked tokens.

## Overview

The strategy:

* Gets the user's entity ID from their address
* Retrieves staking information using the entity ID
* Returns the boosted staking amount as voting power
