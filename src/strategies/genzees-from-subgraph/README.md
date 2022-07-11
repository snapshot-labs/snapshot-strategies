This is simple strategy to use balance from graph instead of archive node.

The configuration would be like this:

```json
{
    "symbol": "GZ",
    "graph": "the api address of your graph",
}
```

The schema of the graph project is:

```
User {
    id: ID!
    genzeeBalance: Int!
}
```

As a example, here is a the graph project for Genzee NFTs: [genzee](https://thegraph.com/hosted-service/subgraph/alephao/genzee).
