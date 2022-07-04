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

## GraphQL queries:

### Pools

```
pools (
  where: {baseToken: "0x282d8efce846a88b159800bd4130ad77443fa1a1"},
  first: 1000, 
  orderBy: baseTokenLiquidity, 
  orderDirection: desc
) {
  id,
  shares (first: 1000) {
    user {
      id
    }
  }
  baseToken {
    id
    symbol
  },
  datatoken {
    id,
    symbol,
    nft {
        id
    }
    holderCount
  }
  isFinalized
  baseTokenLiquidity
}
```
