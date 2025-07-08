# orderly-staked-order

This strategy calculates voting power based on staked ORDER and esORDER tokens on the Orderly Network L2 chain.

The strategy queries the OmniVault contract on Orderly Network to get staking information for each address, including both ORDER and esORDER balances. Both token types contribute equally to the voting power (1 point each).

## How it works

1. Connects to the Orderly Network L2 chain via custom RPC
2. Calls `getStakingInfo(address)` on the OmniVault contract
3. Returns `orderBalance + esOrderBalance` as the total voting power

## Parameters

This strategy doesn't require any parameters as it uses hardcoded contract addresses and RPC endpoints specific to the Orderly Network.

```json
{}
```

## Network

- **Chain**: Orderly Network L2 (Chain ID: 291)
- **RPC**: https://rpc.orderly.network
- **Contract**: 0x7819704B69a38fD63Cc768134b8410dc08B987D0 (OmniVault)
