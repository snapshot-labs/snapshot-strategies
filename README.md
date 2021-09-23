# Snapshot strategies

### Development

#### Install dependencies
```bash
npm install
```

#### Build package
```bash
npm run build
```

#### Test strategy
```bash
# Test default strategy (erc20-balance-of)
npm run test
# Test strategy with name
npm run test --strategy=erc20-received
npm run test --strategy=eth-balance
# Test with more addresses from addresses.json
npm run test --strategy=eth-balance --more=200 
```

#### Local network test strategy
Testing using a custom network (e.g. dev testing or CI) overrides the default networks, requiring a few extra steps.

##### 1. Create your network
- JSON-RPC endpoint accessible from script run location.
- Governance contract (e.g. your ERC20 contract) deployed and populated with test data.
- Multicall contract deployed (used by snapshot to aggregate data retrieval calls).

##### 2. Update your networks file (e.g. `network/local.json`)
- `multicall`; Multicall contract address on your network.
- `chainId`; Chain Id matching that of your created network.
- `rpc`; connection details for your JSON-RPC endpoint.

##### 3. Update your Strategy test data (e.g. `example.json`)
- `strategy` `address`; governance contract address from deployment on your network.
- `addresses`; test accounts created earlier when creating your network.
- `snapshot`; to an appropriate block height for your network.

##### 4. Test
```bash
# Test default strategy (erc20-balance-of) using local.json networks file
npm run test --network=../../network/local.json
```

### License
[MIT](LICENSE).
