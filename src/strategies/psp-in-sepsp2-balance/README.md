# psp-in-sepsp2-balance

This is a strategy to get PSP balances staked in sePSP2 contract and multiply that by `options.multiplier`.

It works like this:
1. Get BPT balance an account holds
```js
const sePSP_balance = BPT_balance = SPSP.PSPBalance(address)
```

2. Get tokens of the Balancer Pool
```js
const [tokens] = await Vault.getPoolTokens(poolId)
```

3. Construct an exit pool request that could be used to unstake 1 BPT balance
```js
const exitPoolRequest = {
  assets: tokens, // Balancer Pools underlying tokens
  minAmountsOut: [0,0], // minimal amounts received
  userData, // endoded [1, 1e18], // ExitKind.EXACT_BPT_IN_FOR_TOKENS_OUT = 1
  toInternalBalance: false, // transfer tokens to recipient, as opposed to depositing to internal balance
}
  ```

4. Find how many tokens you would receive by unstaking 1 BPT balance
```js
const [amountsOut] = await BalancerHelpers.callStatic.queryExit(
  poolId,
  Zero_account, // sender
  Zero_account, // recipient
  exitPoolRequest
  )
// sender & recipient don't matter as we only getting an estimate
```
`amountsOut` is a representation of BPT balance in the Balancer Pool's underlying tokens. In the same order as `assets`

5. One of the `amountsOut` is PSP portion of 1 BPT.
```js
const PSP_In_1_BPT = amountsOut[index_from_assets]
```

6. Multiply PSP_balance by score multiplier.
```js
const Vote_power = PSP_In_1_BPT * BPT_balance * 2.5
```

Here is an example of parameters:

```json
{
  "address": "0xcafe001067cdef266afb7eb5a286dcfd277f3de5",
  "symbol": "PSP",
  "decimals": 18,
  "sePSP2": {
    "address": "0x593F39A4Ba26A9c8ed2128ac95D109E8e403C485",
    "decimals": 18
  },
  "balancer": {
    "poolId": "0xcb0e14e96f2cefa8550ad8e4aea344f211e5061d00020000000000000000011a",
    "BalancerHelpers": "0x5aDDCCa35b7A0D07C74063c48700C8590E87864E",
    "Vault": "0xBA12222222228d8Ba445958a75a0704d566BF2C8"
  },
  "multiplier": 2.5
}
```
