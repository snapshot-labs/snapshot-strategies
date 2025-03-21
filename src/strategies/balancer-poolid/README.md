# Balancer-poolId

This strategy returns balances of the underlying token in Balancer LP pools. 
The use of poolId and pagination makes it better suited to balancer pools with lots of shares (more than 1000)

Here is an example of parameters:

```json
{
  "token": "0xcafe001067cdef266afb7eb5a286dcfd277f3de5",
  "poolId": "0xcb0e14e96f2cefa8550ad8e4aea344f211e5061d00020000000000000000011a",
}
```

- *token* - the underlying token
- *poolId* - the id of the Balancer pool
