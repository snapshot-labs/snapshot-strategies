# Rowdy Roos Voting Strategy

This strategy can check the claimed balance and unclaimed balance of staking rewards, based off the Rowdy Roos staking contract. This means that it will include the balance that is still pending in the contract.

The staking contract is expected to have the following two functions:
- `function getStakedTokens(address _owner) external view returns (uint16[] memory)`
- `function currentRewardsOf(uint16 _tokenId) public view returns (uint256)`

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
    "name": "Balance and Staking Unclaimed",
    "strategy": {
      "name": "balance-and-staking-unclaimed",
      "params": {
        "staking": "0xcC5CcdcbB9C4bc26e387052a94FA93b8890D5693",
        "token": "0x2Af3cc814B0a10ABeD25C62b9bB679Da667E4bda",
        "symbol": "BOBL",
        "decimals": 18
      }
    }
  }
]
```
