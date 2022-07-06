# Ocean marketplace v4

```version 0.1```

This strategy gives score aka votes to the liquidity providers on the [Ocean marketplace v4](https://market.oceanprotocol.com). This means that LP participants can vote for OceanDAO grants via Snapshot without removing their liquidity.

## Solution description

The solution pulls the needed data from all Ocean Protocol subgraphs using the following path:  
```https://subgraph.{network}.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph```

This strategy is designed to give voting scores only to marketplace liquidity providers by calculating their individual pool shares. 

The remaining vote count comes from other strategies configured in [OceanDAO Snapshot Page](https://vote.oceanprotocol.com/#/).  

For v4, we only look at pools w/ OCEAN as the basetoken, and pools that have been proprely initialized. We then attributes votes to LP'ers like this:
```
user_votes = user_pool_shares * (total_Ocean_in_the_pool / total_number_of_pool_shares)
```
This is done for all pools and the votes for the users are added up.

To extend or run this strategy please use the setup described [here](https://docs.snapshot.page/strategies).

## v3 vs. v4 differences
- In v4 we have to check if the pool basetoken is Ocean. Only Ocean tokens will obtain voting power.
- In v4, pools.datatoken.holderCount is always 0 as datatokens are consumed as soon as they are purchased
- In v4, pools.isFinalized checks if the pool has been properly setup. In v3 the equivalent was pools.active

## Ocean ERC20 Addresses
You need to submit the ERC20 Ocean tokenAddress via the stratgy parameters. These [can be found here](https://github.com/oceanprotocol/contracts/blob/v4main/addresses/address.json)   

Addresses by network:
```
'1': '0x967da4048cD07aB37855c090aAF366e4ce1b9F48', //mainnet
'3': '0x5e8DCB2AfA23844bcc311B00Ad1A0C30025aADE9', //ropsten
'42': '0x8967bcf84170c91b0d24d4302c2376283b0b3a07', //rinkeby
'56': '0xDCe07662CA8EbC241316a15B611c89711414Dd1a', //bsc
'137': '0x282d8efCe846A88B159800bd4130ad77443Fa1A1', //poly
'246': '0x593122AAE80A6Fc3183b2AC0c4ab3336dEbeE528', //ewt
'1285': '0x99C409E5f62E4bd2AC142f17caFb6810B8F0BAAE', //movr
'1287': '0xF6410bf5d773C7a41ebFf972f38e7463FA242477', //glmr
'80001': '0xd8992Ed72C445c35Cb4A2be468568Ed1079357c8' //mumbai
```

## How to Test
(1) Remove comments around debug logs.  
(2) Enable code block inside `index.ts` that verifies expected results.  
```
if (options.expectedResults) {
```
(3) Use the regular testing functionality `yarn test -strategy=ocean-marktplace-v4`
