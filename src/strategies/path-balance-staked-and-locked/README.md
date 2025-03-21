# Path holders, stakers and locked

This strategy return the balances of the holders of $PATH tokens, both in staked and locked contracts
## Accepted options

- **tokenAddress:** Token Address

- **Staking Address:** Staking Address

- **Locked Address:** Array of locked addresses

- **methodABI** ABI method to get balance in locked contract (unclaimed tokens only)

- **symbol** Token of ERC-20

- **decimals** Decimals for ERC-20

## Examples

```JSON
[
  {
    "name": "Example query",
    "strategy": {
      "name": "path-balance-staked-and-locked",
      "params": {
        "tokenAddress": "0x2a2550e0a75acec6d811ae3930732f7f3ad67588",
        "stakingAddress": "0x0bF6eeA205F46d796458D090F3aA333149287854",
        "lockedAddresses": [
          "0xDe48716A14C4CBc09656E21CE7F40FC1a02b3a25",
          "0x67f0260254FB3Cee97dA18077927888Ed72D1f17",
          "0xeE729DB66431e4401D63A38a2048d8CE0DF96eC3",
          "0x8923f2A0465287E2F8564F85a7f62ed34d947594",
          "0xfB05dc346f36eE88680e885CaC881983FAdEcBD4",
          "0x9A319F461A84EA5b508AE1e97113fD1743ED691D"
        ],
         "methodABI": [
          "function getRemainingAmount(address _recipient) external view returns (uint256 amount)"
        ],
        "symbol": "PATH",
        "decimals": 18
      }
    }
  }
]
```