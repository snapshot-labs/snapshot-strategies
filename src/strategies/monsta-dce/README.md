# Monsta DCE Strategy

This custom voting strategy, known as the Monsta DCE Strategy, is designed to determine voting power based on specific criteria. Users must meet certain requirements to have voting power in a snapshot vote.

## Strategy Overview

The Monsta DCE Strategy requires users to hold at least one ERC721 token and have a minimum balance of 5,000,000 of a specified ERC20 token. If users meet these conditions, they will be granted voting power. Otherwise, they will have no voting power.

## Parameters

- ERC721 Token Address: The address of the ERC721 token contract.
- ERC20 Token Address: The address of the ERC20 token contract.
- ERC20 Token Decimals: The number of decimal places used by the ERC20 token.

## Example Setup

Here is an example setup for the Monsta DCE Strategy:

```json
{
  "erc721Address": "0x371a31Bf669Df23628E9D8858CB4b4620B491D83",
  "erc20Address": "0x8A5d7FCD4c90421d21d30fCC4435948aC3618B2f",
  "erc20Decimals": 18
}
