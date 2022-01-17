# Contract call strategy

Allows the tokens locked in marinate contract to be used to calculate voter scores.

## Examples

Can be used instead of the erc20-balance-of strategy, the space config will look like this:

```JSON
{
    "address": "0xe6d557d416ff5640235119369c7e26AA18a906D7",
    "marinateLevels": [0, 1, 2, 3],
    "symbol": "sUMAMI",
    "marinateAddress": "0x190a6b6E8e4D9B8324E1F97127c588C5b082d94b",
    "decimals": 9
}
