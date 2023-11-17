staked-defi-balance
===================

This custom strategy returns the score of addresses based on their staked token balance in a specific staking pool contract. It works with staking contracts built and deployed by Ferrum Network. You can use this strategy to track the cumulative balance of staking contracts deployed on multiple EVM chains by adding it to your space multiple times with the network and contract configuration.

Here is an example of parameters:

```json

{
  "minStakedBalance": "1",
  "contracts": [
    {
      "tokenContractAddress": "0xaf329a957653675613D0D98f49fc93326AeB36Fc",
      "symbol": "cFRM",
      "decimals": 18,
      "stakingPoolContractAddress": "0x35e15ff9ebb37d8c7a413fd85bad515396dc8008",
      "stakingType": "open"
    }
  ]
}
```

Parameters
----------

-   `minStakedBalance`: The minimum staked balance required for a user to be included in the score calculation. The value should be in wei.
-   `contracts`: An array of contract configurations where each configuration contains:
    -   `tokenContractAddress`: The address of the token contract for the staked token.
    -   `symbol`: The symbol of the staked token.
    -   `decimals`: The number of decimals for the staked token.
    -   `stakingPoolContractAddress`: The address of the staking pool contract.
    -   `stakingType`: The type of staking pool contract. Supported values are "open" and "standard".

Examples
--------

To use this strategy in your Snapshot configuration, you can refer to the following example:

<img width="1036" alt="image" src="https://github.com/taha-abbasi/snapshot-strategies/assets/11986835/0c5598e4-5071-4134-b6dd-4dfcf708642a">
