# Staking Claimed & Unclaimed

This strategy can check the claimed and unclaimed balance of staking rewards, based off the Mutant Cat staking contract. This means that it will include the balance that is still pending in the contract.

The staking contract is expected to have the following two functions:
- `depositsOf(address account) public view returns (uint256[] memory)`
- `calculateRewards(address account, uint256[] tokenIds) public view returns (uint256[] memory)`

The strategy returns the total of claimed and unclaimed rewards token.

## Accepted options

- **staking:** The address of the staking contract

- **token:** The address of the rewards ERC20 token

- **symbol:** The symbol of the rewards token

- **decimals** Decimals for ERC-20

## Examples

```JSON

[
  {
    "name": "Staking Claimed and Unclaimed",
    "strategy": {
      "name": "staking-claimed-unclaimed",
      "params": {
        "staking": "0x9b561710fEED0B8d829de89C82F80Bb7B2B364B8",
        "token": "0xceb726e6383468dd8ac0b513c8330cc9fb4024a8",
        "symbol": "WORMS",
        "decimals": 0
      }
    }
  }
]
```
