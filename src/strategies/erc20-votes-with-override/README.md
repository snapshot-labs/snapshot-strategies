# ERC-20 Votes with Override

This strategy is similar to [ERC-20 Votes](../erc20-votes), except that it also allows individual delegators to **override** their vote on a particular proposal if they wish. This is most useful for social (off-chain only) proposals.

If an account has any delegated voting power returned from getVotes, adds that value, minus the balances from any delegators that have also individually voted.

If an account is delegating to itself, then its own token balance will already be included in the getVotes return value.

If an account is delegating to a different valid address, adds the local token balance. The account must be delegated to another valid address, otherwise the local token balance will not be added.

## Options

- **address:** The address of the ERC-20 token contract.
- **symbol:** The display symbol for the token, e.g. "ENS".
- **decimals:** Used to display the correct base units for the token.
- **getVotesName:** Optional. The function name of the [getVotes](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/extensions/ERC20Votes.sol#L64) function, e.g. "getVotes".
- **getVotesABI:** Optional. The ABI specification for the getVotes function.
- **balanceOfName:** Optional. The function name of the [balanceOf](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol#L18) function, e.g. "balanceOf".
- **balanceOfABI:** Optional. The ABI specification for the balanceOf function.
- **delegatesName:** Optional. The function name of the [delegates](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/extensions/ERC20Votes.sol#L57) function, e.g. "delegates".
- **delegatesABI:** Optional. The ABI specification for the delegates function.
