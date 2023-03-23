# Arbitrum Bps of Votable Supply

- [Overview](#overview)
- [Example](#example)
- [Snapshot Delegations](#snapshot-delegations)
- [Example With Snapshot Delegations](#example-with-snapshot-delegations)
- [Options](#options)


## Overview

This strategy retrun the number of bps (0.01%) of vote a delegate control, which is used to enforce the 0.01% snapshot proposer requirment specified in [The Constitution of the Arbitrum DAO](https://docs.arbitrum.foundation/dao-constitution) with a basic validation module (minScore=1)

Arbitrum use an EXCLUDE_ADDRESS (0x00000000000000000000000000000000000A4B86) to mark non-votable tokens, tokens delegated to the EXCLUDE_ADDRESS will be excluded from votable supply. 

## Options

- **address:** The address of the ERC-20 token contract.
- **symbol:** The display symbol for the token, e.g. "ARB".
