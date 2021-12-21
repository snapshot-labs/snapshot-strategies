# Shinobi Staked In TGE Farms

Forked from "dfyn-staked-in-farms" strategy by vatsalgupta13.

Allows fetching the amount of Shinobi tokens staked in different farming contracts, including the TGE framework popular on Shinobi, a fork of Uniswap running on Ubiq. Currently configured for Tentacle.Finance (INK) contracts. By changing 'tokenAddress', 'decimals' and 'symbol' field, this strategy can be used for any tokens listed on Shinobi. This strategy can also be used for all contracts which return the amount of LP tokens in 'balanceOf' call. This strategy uses pair data from Shinobi's subgraph to calculate the amount of a token present in users' LP token balance using the calcTokenBalance() function. A total of three calls have been made:

1) a subgraphRequest to fetch Shinobis's subgraph data
2) a multicall to fetch the staked LP token address corresponding to each farming contract and
3) a multicall to fetch all the users' staked LP token balance across all the farming contracts.

The strategy will also handle the case wherein only one contractAddress is to be used, however that address should also be put in an array.

## Example

The space config will look like this:

```JSON
{
  "strategies": [
    ["shinobi-staked-in-tge-farms", {
      // farming contracts across which token balance needs to be calculated
          "contractAddresses": [
          "0x6e142959f49d364b30f0478949effdcb58effe44", // UBQ/INQ
          "0xC4f628150EaDcA9864641e3BF65F8Ea4Fd75e23B", // GRANS/INK
          "0x6E59E5cd333CE71D3AFDEdae09949729dC2fe4B3", // INK/ESCH
        ],
      // token address
      "tokenAddress": "0x7845fCbE28ac19ab7ec1C1D9674E34fdCB4917Db",
      // token decimals
      "decimals": 18,
      // token symbol
      "symbol": "INK",
      // scoreMultiplier can be used to increase users' scores by a certain magnitude
      "scoreMultiplier": 1,
      // ABI for balanceOf method
      "methodABI_1": {
            "inputs": [
              {
                "internalType": "address",
                "name": "account",
                "type": "address"
              }
            ],
            "name": "balanceOf",
            "outputs": [
              {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
              }
            ],
            "stateMutability": "view",
            "type": "function"
          },
          // ABI for stakingToken method
          "methodABI_2": {
            "inputs": [],
            "name": "stakingToken",
            "outputs": [
              {
                "internalType": "contract IERC20",
                "name": "",
                "type": "address"
              }
            ],
            "stateMutability": "view",
            "type": "function"
          }
    }],
  ]
}
```
