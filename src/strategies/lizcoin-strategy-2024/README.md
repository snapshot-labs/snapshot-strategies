# Lizcoin Voting Strategy 2024
lizcoin-strategy-2024

A voting strategy for Lizard Labs' Lizcoin ERC20 Token (LIZ).

The strategy is based on the quadratic voting formula. The strategy counts only staked and vested tokens – details
follow bellow.

## Eligible $LIZ forms:
* Staked $LIZ
* Staked LP tokens (converted back to their value in $LIZ)
* vLIZ pre-tokens (investors) in a wallet
* veLIZ pre-tokens (team) in a wallet
* ANY position in the pre-token vesting contract, whether it came from vLIZ, veLIZ, or was set manually for e.g. KOLs

## Ineligible $LIZ forms:
* Regular $LIZ or LP tokens in a wallet
* cLIZ tokens in a wallet
* Staking or loot box rewards that are unclaimed

Here is an example of parameters:

```json
{
  "lizcoinAddress": "0xAF4144cd943ed5362Fed2BaE6573184659CBe6FF",
  "cLIZAddress": "0x0F9dc0c0A46733c8b9a6C2E4850913Ed31d31205",
  "vLIZAddress": "0xe20C4edb8440CaDD4001c144B4F38576d1AA3820",
  "veLIZAddress": "0xC817C0B518e8Fc98034ad867d679d4f8A284BFBE",
  "cLIZConversionRate": 0.01,
  "vLIZConversionRate": 0.01,
  "veLIZConversionRate": 0.01,
  "uniswapV2PoolAddress": "0xD47B93360EAADBA2678c30F64209a42b9800cEE4",
  "stakingContractAddress": "0xEf2E841AA9F49cc0E54697A4Afa6361eA24d682F",
  "vestingContractAddress": "0x895ecdCAC6431272946Ec615eD368d2f42fC2b44"
}
```
