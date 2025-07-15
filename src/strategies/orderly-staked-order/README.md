# orderly-staked-order

This strategy calculates voting power based on staked ORDER and esORDER tokens on the Orderly Network.

The strategy queries the OmniVault contract to get staking information for each address, including both ORDER and esORDER balances. Both token types contribute equally to the voting power (1 point each).

## How it works

1. Uses the provided network and RPC provider
2. Calls `getStakingInfo(address)` on the OmniVault contract via Multicaller
3. Returns `orderBalance + esOrderBalance` as the total voting power

## Parameters

This strategy doesn't require any parameters as it uses a hardcoded contract address.

```json
{}
```

## Contract

- **OmniVault**: 0x7819704B69a38fD63Cc768134b8410dc08B987D0
