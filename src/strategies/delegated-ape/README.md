# Delegated APE Strategy

This strategy implements delegation logic for voting on the Curtis network by calling a specific delegation contract. It calculates voting power by combining delegated votes with the voter's own ETH balance.

## How it works

The strategy performs the following steps:

1. **Query delegation contract**: Calls contract `0xdd6b74123b2ab93ad701320d3f8d1b92b4fa5202` on the Curtis network
2. **Get delegators**: Uses `getDelegators(address delegate, bytes32 id)` to find all addresses that have delegated to each voter
3. **Check delegation status**: Uses `delegation(address delegator, bytes32 id)` to verify delegation status 
4. **Calculate voting power**: Calls `getEthBalance` on all relevant addresses to determine total voting power
5. **Apply delegation logic**: If an address hasn't delegated to anyone (delegation returns zero address), their own balance is included

## Parameters

| Parameter | Description | Default |
| --------- | ----------- | ------- |
| `decimals` | Number of decimals for the token | 18 |
| `symbol` | Symbol for display purposes | APE (with delegation) |

## Technical Details

- **Contract Address**: `0xdd6b74123b2ab93ad701320d3f8d1b92b4fa5202`
- **Delegation ID**: `0x0000000000000000000000000000000000000000000000000000000000000001`
- **Network**: Curtis (network ID: 60808)

The strategy uses multicall for efficient batch querying of the delegation contract and ETH balances.

## Example Configuration

```json
{
  "symbol": "APE (with delegation)",
  "decimals": 18
}
```

## Usage

This strategy is designed for governance systems where:
- Users can delegate their voting power to other addresses
- Voting power is based on ETH balance
- Delegation is handled through a specific contract on the Curtis network
- Non-delegating addresses retain their own voting power

The strategy ensures that delegated voting power is properly aggregated while avoiding double-counting for addresses that have delegated their votes to others.
