# cap-voting-power

This strategy is used to calculate the off-chain voting power for addresses with tokens vested in a contract. It also includes a clamping mechanism to limit the voting power of the vesting contracts based on the total voting power of the voting escrow contract. All parameters are required.

Some things to note if you plan on using this strategy:

1. All vestingAddresses objects MUST have address, lockedTokens, cliffMonths, vestingMonths, startDateTimestamp and initialReleasePercentage.
2. The Vesting Contract's voting power is clamped to a percentage (clampPercentage) of the total voting power. This value must be between 0 and 1.
3. Total voting power is calculated based on the Voting Escrow Contract's voting power. Therefore, you must specify the voting escrow contract address (votingEscrowContractAddress) and the number of decimals in your token (decimals) as parameters.
4. For optimal performance and memory management, the strategy imposes a limit of 500 vesting addresses in the parameters. Adhere to this limit when setting up the strategy.

Here is an example of parameters:

```json
{
  "votingEscrowContractAddress": "0x3362A77AC77fF5098618F8C7CFB4eA27E738229f",
  "decimals": 18,
  "vestingAddresses": [
    {
      "address": "0x1E1A51E25f2816335cA436D65e9Af7694BE232ad",
      "lockedTokens": 1000,
      "cliffMonths": 12,
      "vestingMonths": 24,
      "startDateTimestamp": 1602033545,
      "initialReleasePercentage": 0.25
    },
    {
      "address": "0x1F717Ce8ff07597ee7c408b5623dF40AaAf1787C",
      "lockedTokens": 2000,
      "cliffMonths": 12,
      "vestingMonths": 24,
      "startDateTimestamp": 1602033545,
      "initialReleasePercentage": 0.25
    },
    {
      "address": "0x1c7a9275F2BD5a260A9c31069F77d53473b8ae2e",
      "lockedTokens": 5000,
      "cliffMonths": 12,
      "vestingMonths": 24,
      "startDateTimestamp": 1602033545,
      "initialReleasePercentage": 0.25
    },
    {
      "address": "0xC83df6FD76484938C10843fa37c7Cbba327c8eDC",
      "lockedTokens": 10000,
      "cliffMonths": 12,
      "vestingMonths": 24,
      "startDateTimestamp": 1602033545,
      "initialReleasePercentage": 0.25
    },
    {
      "address": "0x8E83aD3ecC12E2e2Df1021CDe01e53C9465D5883",
      "lockedTokens": 20000,
      "cliffMonths": 12,
      "vestingMonths": 24,
      "startDateTimestamp": 1602033545,
      "initialReleasePercentage": 0.25
    }
  ],
  "clampPercentage": 0.4
}
```