# Staked Dfyn in Farming Contracts

Allows fetching the amount of $DFYN staked in different farming contracts. By changing 'tokenAddress', 'decimals' and 'symbol' field, this strategy can also be used for other tokens. This strategy can be used for all contracts which return the amount of LP tokens in 'balanceOf' call. This strategy uses pair data from Dfyn's subgraph to calculate the amount of $DFYN present in users' LP token balance using the calcTokenBalance() function. A total of three calls have been made: 1) a subgraphRequest to fetch Dfyn's subgraph data 2) a multicall to fetch the staked LP token address corresponding to each farming contract and 3) a multicall to fetch all the users' staked LP token balance across all the farming contracts.

The strategy will also handle the case wherein only one contractAddress is to be used, however that address should also be put in an array.

## Example

The space config will look like this:

```JSON
{
  "strategies": [
    ["dfyn-staked-in-farms", {
      // farming contracts across which token balance needs to be calculated
          "contractAddresses": [
          "0xEdBB73C0ccD3F00cD75c2749b0df40A1BE394EE2", 
          "0x52b965ccd44A98A8aa064bC597C895adCD02e9BC",
          "0x001A4e27CCDfe8ed6BBaFfEc9AE0985aB5542BEf",
          "0xEAb0FD1FE0926E43b61612d65002Ba6320AA1080"
        ],
      // token address
      "tokenAddress": "0xc168e40227e4ebd8c1cae80f7a55a4f0e6d66c97",
      // token decimals
      "decimals": 18,
      // token symbol
      "symbol": "DFYN",
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