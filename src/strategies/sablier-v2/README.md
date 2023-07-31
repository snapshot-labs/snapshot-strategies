# sablier-v2

This set of strategies returns various amounts related to Sablier V2 streams for any given asset.

### Setup

```json
{
  "address": "0x97cb342cf2f6ecf48c1285fb8668f5a4237bf862",
  "symbol": "DAI",
  "decimals": 18,
  "policy": "withdrawable-recipient" // recommended,
}
```

#### Other parameters

Aside from this example setup, we use Snapshot's base parameters such as `Network`, `Snapshot`(block) or `Addresses`.
Based on the chosen strategy, the values filled in the `Addresses` field will represent a list (>= 1) of senders or recipients.

### Policies

| Policy                 | Methodology                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| withdrawable-recipient | Tokens available for withdrawal from the stream.                                              |
| streamed-recipient     | Tokens that have been streamed until the snapshot.                                            |
| deposited-recipient    | Tokens that have been deposited in streams the recipient owns at snapshot.                    |
| deposited-sender       | Tokens that have been deposited in streams started by the sender by the time of the snapshot. |

### Example

```
Sablier V2 Stream #000001
---
Deposited: TKN 1000 for 30 days
Withdrawn: TKN 450 before snapshot
Snapshot: Day 15 (Half) with a streamed amount of TKN 500

+------------------------+----------+
| POLICY                 | POWER    |
+------------------------+----------+
| withdrawable-recipient | TKN 50   |
+------------------------+----------+
| streamed-recipient     | TKN 500  |
+------------------------+----------+
| deposited-recipient    | TKN 1000 |
+------------------------+----------+
| deposited-sender       | TKN 1000 |
+------------------------+----------+
| erc20-balance-of       | TKN 450  |
+------------------------+----------+
```

### Details and Caveats

#### `withdrawable-recipient`

The withdrawable amount represents assets that have been streamed but not withdrawn yet by the recipient.

It relies on the `withdrawableAmountOf` contract [method](https://docs.sablier.com/contracts/v2/reference/core/abstracts/abstract.SablierV2Lockup#withdrawableamountof).

We recommend using the `withdrawable-recipient` strategy alongside `erc20-balance-of` for the best results. It counts assets is the user's wallet, as well as assets streamed but not withdrawn yet.

#### `streamed-recipient`

It aggregates historical amounts that have already been streamed to the recipient. This will also include already withdrawn assets.

It relies on the `streamedAmountOf` contract methods ([linear](https://docs.sablier.com/contracts/v2/reference/core/contract.SablierV2LockupLinear#streamedamountof), [dynamic](https://docs.sablier.com/contracts/v2/reference/core/contract.SablierV2LockupDynamic#streamedamountof)).

_Caveat #1:_ Careful when using alongside `erc20-balance-of` as it may double count assets. In the [example](#example): `TNK 500` streamed from which `TKN 450` withdrawn equals a voting power or `TKN 950`.

_Caveat #2:_ If funds are recycled (streamed, withdrawn and streamed again) the voting power may be increased artificially.

#### `deposited-recipient`

It aggregates historical deposits up to the moment of the snapshot. Counts streams owned by the recipient.

_Caveat #1:_ Streaming, canceling and streaming again will cause assets to be counted multiple times.

#### `deposited-sender`

It aggregates historical deposits up to the moment of the snapshot. Counts streams started by the sender.

_Caveat #1:_ Streaming, canceling and streaming again will cause assets to be counted multiple times.

_Caveat #2:_ This also takes into account streams created through PRB-Proxy instances configured through the frontend app. Read more about it in the [docs](https://docs.sablier.com/contracts/v2/reference/overview#periphery).
