# sablier-v2

This set of strategies calculates amounts related to Sablier V2 streams for any given asset.

### Setup

Here is an example of parameters:

```json
{
  "address": "0x97cb342cf2f6ecf48c1285fb8668f5a4237bf862",
  "symbol": "DAI",
  "decimals": 18,
  "policy": "withdrawable-recipient",
  "accounts": "all"
}
```

Aside from this example, we use Snapshot required parameters like `Network`, `Snapshot`(block) or `Addresses`.
If the `accounts` custom parameter is set to "addresses" we'll use the values in the `Addresses` box to filter voting power only for matching parties. In contrast, choosing "all" will simply show voting power for all accounts that interacted with Sablier V2 streams at the time of the snapshot (based on the chosen strategy: recipients or senders).

### Policies

| Policy                 | Methodology                                                                                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| withdrawable-recipient | Checks how many tokens are available to be withdrawn by the recipient from the stream. The amount represents assets that have been streamed but not withdrawn yet to the user's wallet.  |
| streamed-recipient     | Checks how many tokens have been streamed until the snapshot. This will also include already withdrawn assets. _Caveat: If used alongside `erc20-balance-of` it may double count._       |
| deposited-recipient    | Checks how many tokens have been deposited in streams the recipient owns at snapshot. _Caveat: Streaming, canceling and streaming again will cause assets to be counted multiple times._ |
| deposited-sender       | Checks how many tokens have been deposited in streams started by the sender before the snapshot. _Caveat: See above._                                                                    |

We recommend using the `withdrawable-recipient` strategy, combined with the `erc20-balance-of` strategy for the best results.

### Examples

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
