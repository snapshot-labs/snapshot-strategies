# beacon-chain

This strategy calculates voting power based on Gnosis Beacon Chain validators owned by specific addresses. It queries the Gnosis Consensus Layer API to fetch active validators and filters them by withdrawal credentials to determine ownership.

## How it works

1. **Fetches active validators** from the Gnosis Beacon Chain API
2. **Filters by withdrawal credentials** - validators with withdrawal credentials ending with the user's address
3. **Sums validator balances** for each address to calculate voting power
4. **Applies multiplier** to convert from gwei to the desired unit (e.g., GNO)

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `clEndpoint` | string | `https://rpc-gbc.gnosischain.com` | Consensus Layer API endpoint |
| `clMultiplier` | string | `1` | Divisor to convert validator balance (e.g., `32` to convert gwei to GNO) |
| `decimals` | number | `9` | Number of decimals for the final result |

## Example

```json
{
  "clEndpoint": "https://rpc-gbc.gnosischain.com", 
  "clMultiplier": "32",
  "decimals": 9
}
```

## Withdrawal Credentials

The strategy looks for validators with withdrawal credentials that:
- Start with `0x01` (ETH1 withdrawal credentials) or `0x02` (ETH2 withdrawal credentials)
- End with the 40-character hex representation of the user's address

This ensures only validators controlled by the specified addresses are counted toward voting power.
