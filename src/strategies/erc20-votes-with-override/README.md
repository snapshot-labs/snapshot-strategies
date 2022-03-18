# ERC-20 Votes with Override

- [Overview](#overview)
- [Example](#example)
- [Snapshot Delegations](#snapshot-delegations)
- [Example With Snapshot Delegations](#example-with-snapshot-delegations)
- [Options](#options)


## Overview

This strategy is similar to [ERC-20 Votes](../erc20-votes), except that it also allows individual delegators to **override** their vote on a particular proposal if they wish. This is most useful for social (off-chain only) proposals.

If an account has any delegated voting power returned from getVotes, adds that value, minus the balances from any delegators that have also individually voted.

If an account is delegating to itself, then its own token balance will already be included in the getVotes return value.

If an account is delegating to a different valid address, adds the local token balance. The account must be delegated to another valid address, otherwise the local token balance will not be added.


## Example

Say you have accounts [A,B,C], each with token balances [100,200,300], and they are delegated on-chain like so:
![Delegation Example 1](https://i.imgur.com/loMPDiu.png)

The on-chain voting power with these delegations (using the standard [OpenZeppelin ERC20Votes](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/extensions/ERC20Votes.sol) system) is then:
| A | B | C |
| ------------- | ------------- | ------------- |
| 0 | 100 | 500 |

With the regular [erc20-votes strategy](https://github.com/snapshot-labs/snapshot-strategies/tree/master/src/strategies/erc20-votes), each account would only have access to its own on-chain delegated voting power, and delegators without voting power will not be able to vote on Snapshot proposals. In the scenario above, account A would not be able to vote at all. And account B would still be able to vote even though it is delegating to C, but it would only have access to the 100 voting power from A.

With this **erc20-votes-with-override** strategy, now individual delegators will be able to vote on Snapshot proposals and access their own token balance as voting power, without needing to perform any additional on-chain transactions.

Here are the scores that would be given using this override strategy, depending on who votes:
| Voters | Score A | Score B | Score C |
| ------------- | ------------- | ------------- | ------------- |
| A | 100 | | |
| B | | 300 | |
| C | | | 500 |
| A,B | 100 | 200 | |
| A,C | 100 | | 500 |
| B,C | | 300 | 300 |
| A,B,C | 100 | 200 | 300 |

When an account votes, it will have access to its own token balance, and also any delegated voting power, _minus_ the balances of any delegators that have also voted. That's how it ensures that delegators can "override" their delegates but still no double-counting happens.


## Snapshot Delegations

Accounts can also delegate [via Snapshot](https://docs.snapshot.org/guides/delegation) as well.

If the `includeSnapshotDelegations` option is enabled, then Snapshot delegations will also be taken into account. In this case, the `isSnapshotDelegatedScore` option will determine whether the delegated or non-delegated scores will be returned. This is done because the overridden voting power calculation is not compatible with the standard [delegation](../delegation) strategy ([see below](#example-with-snapshot-delegations)). So instead, space admins can use this strategy **twice**, each with `includeSnapshotDelegations` enabled and the `isSnapshotDelegatedScore` enabled or disabled.

Here is an example of enabling Snapshot delegations using this strategy twice:

Delegated strategy:

```
{
  "symbol": "ENS (delegated)",
  "address": "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
  "decimals": 18,
  "includeSnapshotDelegations": true,
  "isSnapshotDelegatedScore": true
}
```

Non-delegated strategy:

```
{
  "symbol": "ENS",
  "address": "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
  "decimals": 18,
  "includeSnapshotDelegations": true,
  "isSnapshotDelegatedScore": false
}
```


## Example With Snapshot Delegations

Take the same example [from above](#example), with accounts [A,B,C], each with token balances [100,200,300]. This time we'll also add some Snapshot delegations:
![Delegation Example 2](https://i.imgur.com/bb2rC5J.png)

The regular [delegation](../delegation) strategy doesn't work here, specifically because of the "override" mechanism. It calculates the list of delegators that were not in the original address list, and passes **only those delegators** into the underlying strategy. So the underlying strategy has no idea that other addresses voted as well. Because of that, using the standard delegation strategy with this override strategy can lead to double-counting.

Taking our example from above, here are the Snapshot delegated scores that occur when using the regular [delegation](../delegation) strategy:
| Voters | Score A | Score B | Score C |
| ------------- | ------------- | ------------- | ------------- |
| A | 0 | | |
| B | | 0 | |
| C | | | 300 |
| A,B | 0 | 0 | |
| A,C | 0 | | 300 |
| B,C | | 0 | 100 |
| A,B,C | 0 | 0 | 0 |

So in this case the total scores, when both the regular and delegated strategies are used together, are:
| Voters | Score A | Score B | Score C |
| ------------- | ------------- | ------------- | ------------- |
| A | 100 | | |
| B | | 300 | |
| C | | | 800 |
| A,B | 100 | 200 | |
| A,C | 100 | | 800 |
| B,C | | 300 | 400 |
| A,B,C | 100 | 200 | 300 |

You can see that in some scenarios double-counting occurs, in [C], [A,C], and [B,C].

This override strategy addresses this by retrieving the Snapshot delegations directly, and then calculating the scores as if all those delegators were also voting. Take the scenario where only C votes. This strategy will:

- Retrieve Snapshot delegators [A,B]
- [A,B] are added to the total address list, so it becomes [A,B,C]
- The regular calculations are done, so: {A: 100, B: 200, C: 300}
- Depending on the value of `isSnapshotDelegatedScore`:
  - If false, only the score for C is returned: {C: 300}
  - If true, the scores for all Snapshot delegators of C are summed up, so {A:100,B:200} is summed and the strategy returns {C: 300}
- The final score is then C: 300 + 300 delegated, which is correct


## Options

- **address:** The address of the ERC-20 token contract.
- **symbol:** The display symbol for the token, e.g. "ENS".
- **decimals:** Used to display the correct base units for the token.
- **includeSnapshotDelegations:** Optional. If enabled, Snapshot delegations are taken into account. See description above.
- **isSnapshotDelegatedScore:** Optional. Only used if `includeSnapshotDelegations` is enabled. If true, the delegated score will be returned, otherwise the non-delegated score will be returned. See description above.
- **delegationSpace:** Optional. Only used if `includeSnapshotDelegations` is enabled. Determines what specific Snapshot space to retrieve delegations for.
- **getVotesName:** Optional. The function name of the [getVotes](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/extensions/ERC20Votes.sol#L64) function, e.g. "getVotes".
- **getVotesABI:** Optional. The ABI specification for the getVotes function.
- **balanceOfName:** Optional. The function name of the [balanceOf](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol#L18) function, e.g. "balanceOf".
- **balanceOfABI:** Optional. The ABI specification for the balanceOf function.
- **delegatesName:** Optional. The function name of the [delegates](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/extensions/ERC20Votes.sol#L57) function, e.g. "delegates".
- **delegatesABI:** Optional. The ABI specification for the delegates function.
