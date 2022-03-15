# ERC-20 Votes with Override

This strategy is similar to [ERC-20 Votes](../erc20-votes), except that it also allows individual delegators to **override** their vote on a particular proposal if they wish. This is most useful for social (off-chain only) proposals.

If an account has any delegated voting power returned from getVotes, adds that value, minus the balances from any delegators that have also individually voted.

If an account is delegating to itself, then its own token balance will already be included in the getVotes return value.

If an account is delegating to a different valid address, adds the local token balance. The account must be delegated to another valid address, otherwise the local token balance will not be added.

If the `includeSnapshotDelegations` option is enabled, then Snapshot delegations will also be taken into account. In this case, the `isSnapshotDelegatedScore` option will determine whether the delegated or non-delegated scores will be returned. This is done because the overridden voting power calculation is not compatible with the standard [delegation](../delegation) strategy. So instead, space admins can use this strategy **twice**, each with `includeSnapshotDelegations` enabled and the `isSnapshotDelegatedScore` enabled or disabled.

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
