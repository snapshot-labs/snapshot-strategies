# Sacra score power from Subgraph

Calculates users power by hero score from Sacra subgraph.

```
  heroEntities(
    where:{
      owner: $address
      dead: false
    }
    orderBy: score
    orderDirection: desc
    first: 1000
  ) {
    score
  }
  
  itemEntities(
    where:{
      user: $address
      dead: false
    }
    orderBy: score
    orderDirection: desc
    first: 1000
  ) {
    score
  }
  
  
  pawnshopPositionEntities(
    where:{
      borrower: $address
      open: true
      collateralHero_not: null
    }
    orderBy: collateralHero__score
    orderDirection: desc
    first: 1000
  ) {
    collateralHero {
      score
    }
    borrower {
      id
    }
  }
```