# Saffron Finance V2 Strategy

This strategy scans all the pools defined in the SaffronStakingV2 counting up staked SFI. Voting scores are increased
by 10% as a default. The `multiplier` option can be set to numbers such as `1.1` (10% increase) and `1.2` (20% increase).

This strategy does not include counting an account's balances of either [SFI](https://etherscan.io/token/0xb753428af26e81097e7fd17f40c88aaa3e04902c)
or the [SFI Hodl Contract](https://etherscan.io/address/0x4e5ee20900898054e998fd1862742c28c651bf5d). Those are counted by the
`saffron-finance` strategy.

## Testing Saffron Finance strategies

To run Snapshot tests:

```bash
npm run test --strategy=saffron-finance-v2
```

To test running both `saffron-finance` and `saffron-finance-v2` strategies to count accounts' SFI and SFI Hodl Contract
balances:

```bash
cd $SNAPSHOT_STRATEGIES_ROOT
npm run build
tsc test/scores-sfi.ts
node test/scores-sfi.js
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
