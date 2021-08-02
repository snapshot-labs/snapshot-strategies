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

### License
[MIT](LICENSE).
