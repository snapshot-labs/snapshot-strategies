# Arbitrum DAO Percentage of Votable Supply

- [Overview](#overview)
- [Options](#options)

## Overview

This validation module check the number of basis points (bps, i.e. 0.01%) of vote a delegate control, which is used to enforce the 0.01% snapshot proposer requirement specified in [The Constitution of the Arbitrum DAO](https://docs.arbitrum.foundation/dao-constitution).

Arbitrum use an EXCLUDE_ADDRESS (0x00000000000000000000000000000000000A4B86) to mark non-votable tokens, tokens delegated to the EXCLUDE_ADDRESS will be excluded from votable supply.

You should use this validation module with erc20-votes strategy configured with the same token address and decimals.

## Options

- **minBps:** The minimum basis points required to pass validation, e.g. 1
- **address:** The address of the ERC-20 token contract, e.g. "0x912CE59144191C1204E64559FE8253a0e49E6548"
- **decimals:** The decimal of the token, e.g. 18
- **excludeaddr** The special delegation address for non-votable token, e.g. "0x00000000000000000000000000000000000A4B86"
