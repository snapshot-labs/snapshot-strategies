# Livepeer Voting Strategy

This strategy provides voting power for Livepeer orchestrators.

## Overview

The strategy performs two checks:

1. Verifies if an address is an active orchestrator using the `transcoderStatus` function
2. If the address is an orchestrator, retrieves its voting power using the `getVotes` function

## Usage

This strategy doesn't need any parameters. It will automatically check the orchestrator status and voting power for the provided addresses.
