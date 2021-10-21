This is simple strategy to use balance from graph instead of archive node.

The configuration would be like this:

```json
{
    "symbol": "MCB",
    "graph": "the api address of your graph",
    "decimals": 18 
}
```

The schema of the graph project is:

```
Account {
    id: ID!
    balance: BigDecimal!
}
```

As a example, here is a the graph project for MCB token: [mcb-balance](https://thegraph.com/hosted-service/subgraph/renpu-mcarlo/mcb-balance).

And the `decimals` is an optional field. Ignore it if you have already handle it in graph, or set it to the exact decimals of the raw token balance.