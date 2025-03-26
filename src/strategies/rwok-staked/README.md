# RWOK Staked NFT Voting Strategy

This strategy computes voting power based on staked RWOK NFTs. Each staked NFT contributes to the voting power of the holder.

## Parameters

- `network`: The network where the staking contract is deployed (e.g., "8453" for Base mainnet)
- `snapshot`: Block number or 'latest' for the snapshot
- `addresses`: List of addresses to check voting power for

## Contract Details

- Staking Contract: `0x2C0973b082491948A48180D2bf528E7B51D44Eec`
- NFT Multiplier: 300030

## Example

```json
{
  "network": "8453",
  "snapshot": "latest",
  "addresses": ["0x182db357b1a92a689b428382672Ac6Cd76725D71"]
}
```

## Implementation

The strategy uses the `getStakeInfo(address)` function from the staking contract to determine:
1. The number of NFTs each address has staked
2. The current rewards for the staked NFTs

The voting power is calculated by multiplying the number of staked NFTs by the NFT multiplier.

### Example Response
```json
{
  "0x182db357b1a92a689b428382672Ac6Cd76725D71": 1500150
}
```

## License

MIT 