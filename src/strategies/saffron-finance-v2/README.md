# Saffron Finance V2 Strategy

This strategy scans all the pools defined in the SaffronStakingV2 counting up staked SFI. Voting scores are increased
by 10% as a default. The `multiplier` option can be set to numbers such as `1.1` (10% increase) and `1.2` (20% increase).

This strategy does not include counting an account's balances of either [SFI](https://etherscan.io/token/0xb753428af26e81097e7fd17f40c88aaa3e04902c)
or the [SFI Hodl Contract](https://etherscan.io/address/0x4e5ee20900898054e998fd1862742c28c651bf5d). Those are counted by the
`saffron-finance` strategy.

## Testing Saffron Finance strategies

To run Snapshot tests:

```bash
yarn test --strategy=saffron-finance-v2 --more=500
```

## Strategy Parameters

Example strategy params:

```json
{
  "symbol": "SAFF_STAK_V2",
  "decimals": 18,
  "multiplier": 1.1,
  "stakingPool": "0x4eB4C5911e931667fE1647428F38401aB1661763",
  "singleAssets": [ "0xb753428af26E81097e7fD17f40c88aaA3E04902c", "0xf34960d9d60be18cc1d5afc1a6f012a723a28811"]
}
```

| Parameter      | Description                                                                                |
|----------------|--------------------------------------------------------------------------------------------|
| symbol         | Label for the strategy configuration                                                       |
| decimals       | Number of decimals used by the asset used to calculate voting. Default: 18.                |
| multiplier     | Voting score is multiplied by this value to provide additional voting power. Default: 1.1. |
| stakingPool    | The address of the SaffronStakingV2 contract.                                              |
|                |     Default: "0x4eB4C5911e931667fE1647428F38401aB1661763" (_SaffronStakingV2 Contract_).   |
| singleAssets   | Array of contract addresses of single asset stakings.                                      |
|                |     Default: [ "0xb753428af26E81097e7fD17f40c88aaA3E04902c" ]. (_SFI address_).            |


To count SFI and Hodl Contract balances, use the strategy, `saffron-finance`:

```json
{
      "symbol": "SFI",
      "votingSchemes": [
        {
          "name": "oneToOne",
          "type": "DirectBoostScheme",
          "multiplier": 1.0
        },
        {
          "name": "staking",
          "type": "DirectBoostScheme",
          "multiplier": 1.1
        },
        {
          "name": "uniswap",
          "type": "LPReservePairScheme",
          "multiplier": 1.1
        },
        {
          "name": "sushiswap",
          "type": "LPReservePairScheme",
          "multiplier": 1.1
        }
      ],
      "dexLpTypes": [
        {
          "name": "uniswap",
          "lpToken": "0xC76225124F3CaAb07f609b1D147a31de43926cd6"
        },
        {
          "name": "sushiswap",
          "lpToken": "0x23a9292830Fc80dB7f563eDb28D2fe6fB47f8624"
        }
      ],
      "contracts": [
        {
          "votingScheme": "oneToOne",
          "label": "SFI",
          "tokenAddress": "0xb753428af26e81097e7fd17f40c88aaa3e04902c"
        },
        {
          "votingScheme": "oneToOne",
          "label": "TEAM_HODL_TOKEN",
          "tokenAddress": "0x4e5ee20900898054e998fd1862742c28c651bf5d"
        }
      ]
}

```
