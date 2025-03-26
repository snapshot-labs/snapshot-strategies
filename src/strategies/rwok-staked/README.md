# RWOK Staked NFT Strategy

This strategy calculates voting power based on the number of staked NFTs a user has, with a multiplier applied.

## Parameters

- `address`: The address of the staking contract
- `multiplier`: The multiplier to apply to the number of staked NFTs (default: 30000)

## Example

```json
{
  "name": "rwok-staked",
  "params": {
    "address": "0x1234...5678",
    "multiplier": 30000
  }
}
```

## How it works

1. Gets the number of staked NFTs for each address using the `getStakeInfo` function
2. Applies the multiplier to calculate voting power
3. Returns the voting power for each address

## Notes

- The strategy uses the `getStakeInfo` function to get staked NFT information
- Voting power is calculated as: number of staked NFTs * multiplier
- The default multiplier is 30000 