# Snapshot strategies

## Development

### Install dependencies

```bash
yarn
```

### Build package

```bash
yarn build
```

### Test strategy with predefined tests (params from examples.json file)

> Note: If you're writing a new strategy, make sure to add it to strategies/index.ts before testing*

```bash
# Test default strategy (erc20-balance-of)
yarn test
# Test strategy with name
yarn test --strategy=erc20-received
yarn test --strategy=eth-balance
# Test with more addresses from addresses.json
yarn test --strategy=eth-balance --more=200
```

### Test validation with predefined tests (params from examples.json file)

```
yarn test:validation --validation=basic
```

### Test strategy with different parameters

Change values inside test/scores.ts and run

```bash
ts-node test/scores.ts
```

### Checklist for adding a new voting strategy or validation strategy

Here is a simple checklist to look at when reviewing a PR for a new strategy:

#### Overview

- The strategy must be unique.
- If the strategy does only a single call with an address as input, it's preferable to use the strategy "contract-call" instead of creating a new one.
- For validations better to use `basic` validation and use existing strategies

#### Code

- Strategies should always use a `snapshot` to calculate user's voting power. As a result the voting power should not change throughout the proposal duration.
- There should be a maximum of 5 requests, a request can use "fetch" a "subgraphRequest" or "multicall".
- The strategy should not send a request for each voters, this doesn't scale.
- The strategy PR should not add any new dependency.
- The score returned by the strategy should use the same casing for address as on the input, or should return checksum addresses.
- Make sure that voting power of one address does not depend on other addresses.

#### Example

- Example must include at least 1 address with a positive score.
- Example must use a snapshot block number in the past.

#### Test

- The strategy should take less than 10sec to resolve.
- The strategy should work with 500 addresses. [Here is a list of addresses](https://github.com/snapshot-labs/snapshot-strategies/blob/master/test/addresses.json).

#### Recommended

- Add a README.md file that describes the strategy and provides an example of parameters.
- Use string ABI instead of object.

### License

[MIT](LICENSE).
