# Snapshot.org Staking Strategy

This strategy is designed to calculate the total amount of tokens a user has staked in a staking contract. Originally developed for **Paal**, it can be adapted for use with any other staking contract, provided it is compatible with this structure.

### Key Features
- Calculates the staked token balance for each user.
- Flexible and adaptable to various staking contracts.

### Parameters

{
  "address": "0x85e253162c7e97275b703980f6b6fa8c0469d624",
  "symbol": "PAAL",
  "decimals": 9
}

### Functionality

This strategy utilizes the `shares()` function in Paal smart contracts, which takes a user's address as a parameter and returns two `uint256` values: `amountOfTokens` (the number of tokens staked) and `initTimestamp` (the timestamp when the staking began).

Feel free to integrate it into your project if the contract adheres to a similar staking model.






