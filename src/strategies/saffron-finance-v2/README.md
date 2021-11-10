# Saffron Finance V2 Strategy

This strategy scans all the pools defined in the SaffronStakingV2 counting up staked SFI. Voting scores are increased
by 10% as a default. The `multiplier` option can be set to numbers such as `1.1` (10% increase) and `1.2` (20% increase).

This strategy does not include counting balances of either [SFI](https://etherscan.io/token/0xb753428af26e81097e7fd17f40c88aaa3e04902c)
or the [SFI Hodl Contract](https://etherscan.io/address/0x4e5ee20900898054e998fd1862742c28c651bf5d). Those are picked up with the
`saffron-finance` strategy.

## Testing Saffron Finance strategies

To run Snapshot tests:

```bash
npm run test --strategy=saffron-finance-v2
```

To test running both `saffron-finance` and `saffron-finance-v2`:

```bash
cd $SNAPSHOT_STRATEGIES_ROOT
npm run build
tsc test/scores-sfi.tx
node test/scores-sfi.js
```
