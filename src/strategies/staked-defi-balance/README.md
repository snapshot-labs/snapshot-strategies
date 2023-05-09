staked-defi-balance
===================

This custom strategy returns the score of addresses based on their staked token balance in a specific Ferrum Network DeFi staking pool contract.

Here is an example of parameters:

```json

{
  "tokenContractAddress": "0xe685d3CC0be48BD59082eDe30C3b64CbFc0326e2",
  "symbol": "cFRM",
  "decimals": 18,
  "minStakedBalance": "100000000000000000000000",
  "stakingPoolContractAddress": "0xb4927895cbee88e651e0582893051b3b0f8d7db8",
  "stakingType": "open"
}
```

Parameters
----------

-   `tokenContractAddress`: The address of the token contract for the staked token.
-   `symbol`: The symbol of the staked token.
-   `decimals`: The number of decimals for the staked token.
-   `minStakedBalance`: The minimum staked balance required for a user to be included in the score calculation. The value should be in wei.
-   `stakingPoolContractAddress`: The address of the staking pool contract.
-   `stakingType`: The type of staking pool contract. Supported values are "open" and "standard".

Examples
--------

To use this strategy in your Snapshot configuration, you can refer to the following example:

```json

{
  "name": "Staked Defi Balance",
  "strategy": {
    "name": "staked-defi-balance",
    "params": [
      {
        "tokenContractAddress": "0xaf329a957653675613D0D98f49fc93326AeB36Fc",
        "symbol": "cFRM",
        "decimals": 18,
        "minStakedBalance": "1000000000000000000",
        "stakingPoolContractAddress": "0x35e15ff9ebb37d8c7a413fd85bad515396dc8008",
        "stakingType": "open"
      }
    ]
  },
  "network": "56",
  "addresses": [
    "0x4c4180bf5ec78af9025bdd935ed69e29c2f6cbae",
    "0x5785530b6f0ea72b0dba474d55b43e1af1182cad",
    "0x468b83D6c8941115E9c61385aff8b71ADD5B8cE8",
    "0xdd4ebebe197ca16dc2042414e3b243ab265b0d9a",
    "0x697e8e42a50d9a759a238baab25919b177defb89",
    "0x6479f7157f06e6610174b1029388B8D4193c00A0"
  ],
  "snapshot": 27877333
}
```

Compatibility
-------------

This strategy is compatible with the multi-staked-defi-balance strategy v1.0.0, and it's recommended to use them together for a better user experience.

For more information on how to use this strategy, you can refer to the [multi-staked-defi-balance README](../multi-staked-defi-balance/README.md).