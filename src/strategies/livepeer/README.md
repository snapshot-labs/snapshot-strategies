# Livepeer Voting Strategy

This strategy provides voting power for Livepeer orchestrators. Only addresses that are active orchestrators (also known as transcoders) in the Livepeer network will receive voting power.

## Overview

The strategy performs two checks:

1. Verifies if an address is an active orchestrator using the `transcoderStatus` function
2. If the address is an orchestrator, retrieves its voting power using the `getVotes` function

## Contracts

- Voting Contract: [0x0B9C254837E72Ebe9Fe04960C43B69782E68169A](https://arbiscan.io/address/0x0B9C254837E72Ebe9Fe04960C43B69782E68169A)
- Transcoder Registry: [0x35Bcf3c30594191d53231E4FF333E8A770453e40](https://arbiscan.io/address/0x35Bcf3c30594191d53231E4FF333E8A770453e40)

## Implementation Details

- Network: Arbitrum (Chain ID: 42161)
- An address is considered an orchestrator if `transcoderStatus` returns 1
- Voting power is determined by the `getVotes` function from the voting contract
- Non-orchestrators receive 0 voting power

## Usage

```json
{
  "strategies": [
    {
      "name": "livepeer",
      "params": {}
    }
  ]
}
```

## Example

An example orchestrator address: `0x525419ff5707190389bfb5c87c375d710f5fcb0e`
