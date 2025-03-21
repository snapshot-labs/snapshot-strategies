# RWOK Staked NFT Voting Strategy

This strategy computes voting power based on staked RWOK NFTs. Each staked NFT contributes to the voting power of the holder.

## Parameters

- `network`: The network where the staking contract is deployed (e.g., "1" for Ethereum mainnet)
- `snapshot`: Block number or 'latest' for the snapshot
- `addresses`: List of addresses to check voting power for

## Contract Details

- Staking Contract: `0x2C0973b082491948A48180D2bf528E7B51D44Eec`
- NFT Multiplier: 300030

## Example

```json
{
  "network": "1",
  "snapshot": "latest",
  "addresses": ["0x1234...5678"]
}
```

## Implementation

The strategy uses the `balanceOf` function from the staking contract to determine how many NFTs each address has staked. The voting power is calculated by multiplying the staked balance by the NFT multiplier.

## License

MIT
