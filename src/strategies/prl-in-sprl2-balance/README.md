# prl-in-sprl2-balance

This is a strategy to get PRL balances staked in sPRL2 contract extrapolated as it was 100% of the pool, and multiply that by `options.multiplier`.

It works like this:

1. Depending the `useVoteBalance` flag, get either the BPT balance an account holds using `balanceOf(address)` or `getVotes(address)`

```js
/// useVoteBalance = false:
const BPTBalance = sPRL2.balanceOf(address);
--- OR ---
/// useVoteBalance = true
const BPTBalance = sPRL2.getVotes(address);
```

2. Get tokens of the Balancer Pool

```js
const poolTokens = await BPT.getPoolTokens();
```

3. Find how many tokens you would receive by unstaking 1 BPT balance

```js
const amountsOut: BigNumber[] =
  await balancerRouter.callStatic.queryRemoveLiquidityProportional(
    options.balancerV3.bpt,
    parseUnits('1', options.sPRL2.decimals),
    ZERO_ADDRESS, // sender
    '0x',
    { blockTag }
  );
// sender & recipient don't matter as we only getting an estimate
```

`amountsOut` is a representation of BPT balance in the Balancer Pool's underlying tokens. In the same order as `assets`

4. One of the `amountsOut` is PRL portion of 1 BPT that we parse in float for maths.

```js
const prlFor1BPT = parseFloat(
  formatUnits(amountsOut[prlTokenIndex], options.PRL.decimals)
);
```

5. Multiply by `1.25` the prlFor1BPT to extrapolate the PRL amount as it was single staking pool (the BPT is a 80PRL/20Weth weighted pool)

```js
/// @dev BPT is a 80PRL/20Weth pool, we extrapolate the PRL amount as it was 100% of the pool
const prlFor1BPTExtrapolated = prlFor1BPT * 1.25;
```

6. Multiply prlFor1BPTExtrapolated by score multiplier.

```js
const VotingPower = prlFor1BPTExtrapolated * BPTBalance * 2.5;
```

Here is an example of parameters:

```json
{
  "PRL": {
    "address": "0x6c0aeceeDc55c9d55d8B99216a670D85330941c3",
    "symbol": "PRL",
    "decimals": 18
  },
  "sPRL2": {
    "address": "0xE8A2d848fE656E34A6caA35f375B42979e322135",
    "decimals": 18
  },
  "balancerV3": {
    "bpt": "0x1846C6cBE0D433e152fA358e5fF27968E18bcE7c",
    "router": "0x5C6fb490BDFD3246EB0bB062c168DeCAF4bD9FDd"
  },
  "multiplier": 2.5,
  "useVoteBalance": false
},
```
