# ERC-20 Votes with Override

This strategy is similar to [ERC-20 Votes](../erc20-votes), except that it also allows individual delegators to **override** their vote on a particular proposal if they wish. This is most useful for social (off-chain only) proposals.

If an address has any delegated votes, then that amount will be used, minus the balances of any individual delegators who have also voted.

If an address has 0 delegated votes, then the current token balance will be used. The address must be delegated to another valid address, otherwise 0 will be returned.

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
