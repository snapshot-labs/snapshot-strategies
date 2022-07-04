# Ocean v4 marketplace Snapshot strategy

```version 0.1```

This strategy gives score aka votes to the liquidity providers on the [Ocean marketplace](https://market.oceanprotocol.com). This means that they can vote for OceanDAO votes hosted on the Snapshot platform without the need to remove their liquidity.

## Solution description

The solution pulls the needed data from the Ocean Protocol mainnet subgraph endpoint:
```https://subgraph.{network}.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph```

It is pulling a bit more information than currently used so the solution can also be extended. The current limitation comes from only considering liquidity providers and ignoring pure token holders. This means that the tokens added to the liquidity pool by the pure token holders are accredited to the liquidity providers. This can be fixed but is a bit more complicated as the ratio of datatokens to Ocean tokens has to be considered in a general manner. And the token holders for each pool have to be extracted from the subgraph.

For v4, we check pools w/ OCEAN basetoken that have been initialized, and then attributes votes to them like this:
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

### Datatokens

```
{
datatokens {
  id,
  balances {
    userAddress {
      id
    }
    balance
  }
}
}
```
