# aura-balance-of-vlaura-vebal

This strategy returns proportional voting power for vlAURA holders based on system owned veBAL.

The voting power is based on the raw balance, rather than delegated voting power.

For example:
- there are 10000 vlAURA total supply
- a user has 2000 vlAURA (raw balance)
- Aura's voterProxy owns 100k veBAL

In this example, the user has 20k veBAL balance as they own 20% of the vlAURA voting power.

_Note: When depositing to the auraLocker, a user does not receive vlAURA until the next epoch has begun (Thursday at 00:00 UTC)_

## Params

- `auraLocker` - (**Required**, `string`) Address of AuraLocker (vlAURA) contract
- `auraVoterProxy` - (**Required**, `string`) Address of Aura VoterProxy contract
- `votingEscrow` - (**Required**, `string`) Address of Balancer VotingEscrow contract

Here is an example of parameters:

```json
{
    "auraLocker": "0x3Fa73f1E5d8A792C80F426fc8F84FBF7Ce9bBCAC",
    "auraVoterProxy": "0xaF52695E1bB01A16D33D7194C28C42b10e0Dbec2",
    "votingEscrow": "0xC128a9954e6c874eA3d62ce62B468bA073093F25"
}
```
