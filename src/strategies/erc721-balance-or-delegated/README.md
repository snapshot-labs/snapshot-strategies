# ERC721 Balance or Delegate Strategy

This strategy allows users to vote if they either hold an ERC721 NFT or have voting power delegated to them from that same NFT contract. It combines direct NFT ownership and delegated voting power to determine the final voting score for addresses, with a maximum of 1 in voting power in both cases.

## How it Works

The strategy uses the following logic:
1. **Direct Ownership**: An address with a balance greater than 0 for the specified ERC721 contract gets a voting score.
2. **Delegation**: If an address has voting power delegated to it, it also gets a voting score.
3. **Combined Voting**: Both the delegator and delegate can vote independently if they meet the conditions above.

## Parameters

| Parameter   | Type   | Description                                                                 |
|-------------|--------|-----------------------------------------------------------------------------|
| `address`   | string | The ERC721 contract address to query balances and delegations from.         |
| `symbol`    | string | A string symbol to identify the strategy.                                   |
| `decimals`  | number | Number of decimals, usually set to 0 for ERC721 as it's non-fungible tokens.|

## Example Parameters

Below is an example configuration for the strategy:

```json
{
  "address": "0x4E911626Fa378cC95fB1A26Cc272c070eF79e4b7",
  "symbol": "HVAXVC",
  "decimals": 0
}
