# Multi-Staked-DeFi-Balance Strategy

The `multi-staked-defi-balance` strategy is used to check the cumulative staked balance across multiple staking contracts for users. It calls the `staked-defi-balance` strategy for each staking contract provided in the configuration and returns the users with a cumulative staked balance equal to or greater than the specified `cumulativeMinimumStakedBalance`.

## Configuration

Here is an example configuration object to use with the `multi-staked-defi-balance` strategy:

```json
{
  "symbol": "MULTI-STAKED",
  "cumulativeMinimumStakedBalance": "500000",
  "strategies": [
    {
      "name": "staked-defi-balance",
      "network": "42161",
      "params": {
        "tokenContractAddress": "0xe685d3CC0be48BD59082eDe30C3b64CbFc0326e2",
        "symbol": "cFRM",
        "decimals": 18,
        "minStakedBalance": "1000000000000000000",
        "stakingPoolContractAddress": "0xb4927895cbee88e651e0582893051b3b0f8d7db8",
        "stakingType": "open"
      }
    }
    // ...additional staking contract strategy objects...
  ]
}
```

Parameters
----------

### symbol

The `symbol` parameter should not be changed from "MULTI-STAKED".

### cumulativeMinimumStakedBalance

The `cumulativeMinimumStakedBalance` parameter is a number that represents the minimum cumulative staked balance that should exist for the staker to pass per the strategy. This value is entered in whole numbers (ether base, not wei).

### strategies

The `strategies` array allows the user to configure a single or multiple staking contracts by adding them as objects. The only strategy that should be used is `staked-defi-balance`.

#### Staking Contract Strategy Object

For each staking contract, a new strategy object needs to be added. Here is an example of a strategy object configured for an open staking contract on Arbitrum:
```json
{
  "name": "staked-defi-balance",
  "network": "42161",
  "params": {
    "tokenContractAddress": "0xe685d3CC0be48BD59082eDe30C3b64CbFc0326e2",
    "symbol": "cFRM",
    "decimals": 18,
    "minStakedBalance": "1000000000000000000",
    "stakingPoolContractAddress": "0xb4927895cbee88e651e0582893051b3b0f8d7db8",
    "stakingType": "open"
  }
}
```

##### tokenContractAddress

The `tokenContractAddress` parameter is the contract address of the token being staked.

##### symbol

The `symbol` parameter represents the symbol of the staked token (e.g., "cFRM").

##### decimals

The `decimals` parameter is the number of decimals used by the staked token.

##### minStakedBalance

The `minStakedBalance` parameter is the minimum staked balance required for the staker to be considered in the strategy. This value is entered in wei.

##### stakingPoolContractAddress

The `stakingPoolContractAddress` parameter is the contract address of the staking pool.

##### stakingType

The `stakingType` parameter is the type of staking contract being used. It accepts either "open" or "standard". This parameter determines which ABI to use when making the multicall to fetch the staked balance. The available options are:

-   "open": Use the ABI for open staking contracts
-   "standard": Use the ABI for standard staking contracts

Example
-------

Here's an example of how to use the `multi-staked-defi-balance` strategy with multiple staking contracts:

```json
{
  "name": "Multi Staked Defi Balance",
  "strategy": {
    "name": "multi-staked-defi-balance",
    "params": {
      "symbol": "MULTI-STAKED",
      "cumulativeMinimumStakedBalance": "500000",
      "strategies": [
        {
          "name": "staked-defi-balance",
          "network": "42161",
          "params": {
            "tokenContractAddress": "0xe685d3CC0be48BD59082eDe30C3b64CbFc0326e2",
            "symbol": "cFRM",
            "decimals": 18,
            "minStakedBalance": "1000000000000000000",
            "stakingPoolContractAddress": "0xb4927895cbee88e651e0582893051b3b0f8d7db8",
            "stakingType": "open"
          }
        },
        {
          "name": "staked-defi-balance",
          "network": "56",
          "params": {
            "tokenContractAddress": "0xaf329a957653675613D0D98f49fc93326AeB36Fc",
            "symbol": "cFRM",
            "decimals": 18,
            "minStakedBalance": "1000000000000000000",
            "stakingPoolContractAddress": "0x35e15ff9ebb37d8c7a413fd85bad515396dc8008",
            "stakingType": "open"
          }
        },
        {
          "name": "staked-defi-balance",
          "network": "42161",
          "params": {
            "snapshot": "latest",
            "tokenContractAddress": "0x9f6AbbF0Ba6B5bfa27f4deb6597CC6Ec20573FDA",
            "symbol": "FRM",
            "decimals": 18,
            "minStakedBalance": "1000000000000000000",
            "stakingPoolContractAddress": "0x2bE7904c81dd3535f31B2C7B524a6ed91FDb37EC",
            "stakingType": "standard"
          }
        }
      ]
    }
  },
  "network": "42161",
  "addresses": [
    "0x4c4180bf5ec78af9025bdd935ed69e29c2f6cbae",
    "0x5785530b6f0ea72b0dba474d55b43e1af1182cad",
    "0x468b83D6c8941115E9c61385aff8b71ADD5B8cE8",
    "0xdd4ebebe197ca16dc2042414e3b243ab265b0d9a",
    "0x697e8e42a50d9a759a238baab25919b177defb89",
    "0x6479f7157f06e6610174b1029388B8D4193c00A0"
    ]
}
```

This example demonstrates a configuration with three staking contracts across two different networks (Arbitrum and BSC), and using both open and standard staking types. The strategy will calculate the cumulative staked balance for each user, considering all of the specified staking contracts. Users with a cumulative staked balance equal to or greater than the specified `cumulativeMinimumStakedBalance` will pass the strategy.

## Contributions

Contributions, suggestions, and bug reports are welcome! Please submit them through our GitHub repository.

## License

This project is licensed under the MIT License.