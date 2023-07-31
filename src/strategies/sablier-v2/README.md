# Sablier V2 Strategies

In Sablier V2, a stream creator locks up an amount of ERC-20 tokens in a contract that progressively allocates the funds to the designated
recipient. The tokens are released by the second, and the recipient can withdraw them at any time.

The strategies in this folder read the various amounts that can be found in Sablier V2 streams.

### Example Setup

```json
{
  "address": "0x97cb342cf2f6ecf48c1285fb8668f5a4237bf862",
  "symbol": "DAI",
  "decimals": 18,
  "policy": "withdrawable-recipient" // recommended,
}
```

#### Other parameters

Aside from this example setup, we use Snapshot's base parameters `Network`, `Snapshot` (block), and `Addresses`.

Based on the chosen strategy, the values filled in the `Addresses` field will represent a list (>= 1) of senders or recipients.

### Policies

| Policy                 | Methodology                                                                           |
| :--------------------- | :------------------------------------------------------------------------------------ |
| withdrawable-recipient | Tokens available to be withdrawn by the stream's recipient.                           |
| deposited-recipient    | Tokens that have been deposited in streams the recipient owned at snapshot time.      |
| deposited-sender       | Tokens that have been deposited in streams started by the sender before the snapshot. |
| streamed-recipient     | Tokens that have been streamed to the recipient until the snapshot.                   |

### Example

```text
Sablier V2 Stream #000001
---
Deposited: TKN 1000 for 30 days
Withdrawn: TKN 450 before snapshot
Snapshot: Day 15 (midway) with a streamed amount of TKN 500

+------------------------+----------+
| POLICY                 | POWER    |
+------------------------+----------+
| erc20-balance-of       | TKN 450  |
+------------------------+----------+
| withdrawable-recipient | TKN 50   |
+------------------------+----------+
| deposited-recipient    | TKN 1000 |
+------------------------+----------+
| deposited-sender       | TKN 1000 |
+------------------------+----------+
| streamed-recipient     | TKN 500  |
+------------------------+----------+
```

### Recommendation

For the best results, we recommend using the `withdrawable-recipient` policy alongside `erc20-balance-of`. Doing so will count tokens both in the user's wallet, as well as tokens streamed but not withdrawn yet.

### Details and Caveats

#### `withdrawable-recipient`

The withdrawable amount represents tokens that have been streamed but not withdrawn yet by the recipient.

This is provided by the [`withdrawableAmountOf`](https://docs.sablier.com/contracts/v2/reference/core/abstracts/abstract.SablierV2Lockup#withdrawableamountof) contract method.

#### `deposited-recipient`

It aggregates historical deposits up to the snapshot time, counting only the streams owned by the recipient.

:warning: Caveat: streaming, canceling and streaming again will cause tokens to be counted multiple times.

#### `deposited-sender`

It aggregates historical deposits up to the snapshot time, counting only the streams started by the sender.

:warning: Caveats:

- Streaming, canceling and streaming again will cause tokens to be counted multiple times.
- It takes into account streams created through [PRBProxy](https://docs.sablier.com/contracts/v2/reference/overview#periphery) instances configured through the official [Sablier Interface](https://app.sablier.com/).

#### `streamed-recipient`

It aggregates historical amounts that have already been streamed to the recipient. Crucially, it includes already withdrawn tokens.

It relies on the `streamedAmountOf` methods in the [LockupLinear](https://docs.sablier.com/contracts/v2/reference/core/contract.SablierV2LockupLinear#streamedamountof) and [LockupDynamic](https://docs.sablier.com/contracts/v2/reference/core/contract.SablierV2LockupDynamic#streamedamountof) contracts.

:warning: Caveats:

- Using this policy alongside `erc20-balance-of` may double count tokens. In the example above, `TNK 500` was streamed, but the recipient withdrew `TKN 450`, so the total voting power would be `TKN 950`.
- If funds are recycled (streamed, withdrawn and streamed again) the voting power may be increased artificially.
