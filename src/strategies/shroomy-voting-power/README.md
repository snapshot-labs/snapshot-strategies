# Shroomy Voting Power

This strategy calculates voting power based on users' Shroomy tokens and optionally includes LP tokens with configurable multipliers.

## Overview

The strategy leverages the `getVotingPower` function from a specified contract to:
1. Calculate the base voting power from Shroomy tokens
2. Add additional voting power from LP tokens (with optional multipliers)

## Example

```json
{
  "shroomyToken": "0x6b175474e89094c44da98b954eedeac495271d0f",
  "votingPowerContract": "0x6b175474e89094c44da98b954eedeac495271d0f",
  "shroomyDecimals": 18,
  "lpTokens": [
    {
      "address": "0x9876543210987654321098765432109876543210",
      "decimals": 18,
      "multiplier": 2
    }
  ]
}
```

## Parameters

- **votingPowerContract**: Address of the contract containing the getVotingPower function
- **shroomyToken**: Address of the Shroomy token
- **shroomyDecimals**: Decimal places of the Shroomy token
- **lpTokens**: (optional) List of LP tokens that also count toward voting power
  - **address**: Address of the LP token contract
  - **decimals**: Decimal places of the LP token
  - **multiplier**: (optional) Voting power multiplier for the LP token (default: 1)
