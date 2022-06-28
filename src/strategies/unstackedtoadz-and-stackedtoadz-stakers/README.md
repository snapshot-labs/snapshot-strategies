# UnstackedToadz and StackedToadz Stakers strategy

This strategy return the balances of the voters for StackedToadz project using only the staking pool of UnstackedToadz and StackedToadz.

## Accepted options

- **staking_stackedtoadz:** StackedToadz staking pool address.

- **staking_unstackedtoadz:** UnStackedToadz staking pool address.

## Examples

```JSON
[
  {
    "name": "UnstackedToadz and StackedToadz Stakers",
    "strategy": {
      "name": "unstackedtoadz-and-stackedtoadz-stakers",
      "params": {
        "staking_stackedtoadz": "0xBC9d59a9865c094d22fAAE988533F18eA1688722",
        "staking_unstackedtoadz": "0x1bbb57def2f6192f0b9b8565f49034bf1fcdb604"
      }
    },
    "network": "1",
    "addresses": [
      "0x6d330e23da437fb66e8419e8f52fcd43fa6b8326"
    ],
    "snapshot": 13688108
  }
]

```
