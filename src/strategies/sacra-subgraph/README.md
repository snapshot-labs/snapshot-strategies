# Sacra power from Subgraph

Calculates users power by passed biomes

```
  heroActions(
    where:{
      action: 3
      owner_in: [$address]
    }
  ) {
    values
  }
```