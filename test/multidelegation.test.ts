import { strategy } from '../src/strategies/multidelegation/index';
import * as legacyDelegationStrategy from '../src/strategies/delegation/index';
import * as multidelegationUtils from '../src/strategies/multidelegation/utils';
import * as utils from '../src/utils';

const SPACE = 'space1';
const NETWORK = '1';
const PROVIDER = 'provider1';
const ADDRESSES = ['address1', 'address2'];
const OPTIONS = {
  strategies: [
    {
      name: 'erc20-balance-of',
      params: {
        symbol: 'WMANA',
        address: '0xfd09cf7cfffa9932e33668311c4777cb9db3c9be',
        decimals: 18
      }
    }
  ]
};
const SNAPSHOT = 'snapshot1';

function mockLegacyDelegation(result: { [k: string]: any }) {
  return jest
    .spyOn(legacyDelegationStrategy, 'strategy')
    .mockResolvedValue(result);
}

function mockGetMultiDelegations(result: { [k: string]: any }) {
  return jest
    .spyOn(multidelegationUtils, 'getMultiDelegations')
    .mockResolvedValue(result);
}

function mockGetScoresDirect(result: Record<string, unknown>[]) {
  return jest.spyOn(utils, 'getScoresDirect').mockResolvedValue(result);
}

// Test case 1: Test for empty legacyDelegations and multiDelegations
test('Test for empty legacyDelegations and multiDelegations', async () => {
  // Mock the legacyDelegationStrategy and getMultiDelegations functions
  const legacyDelegation = mockLegacyDelegation({});
  const getMultiDelegations = mockGetMultiDelegations({});

  // Call the strategy function
  const result = await strategy(
    SPACE,
    NETWORK,
    PROVIDER,
    ADDRESSES,
    OPTIONS,
    SNAPSHOT
  );

  // Expectations
  expect(legacyDelegation).toHaveBeenCalledWith(
    SPACE,
    NETWORK,
    PROVIDER,
    ADDRESSES,
    OPTIONS,
    SNAPSHOT
  );
  expect(getMultiDelegations).toHaveBeenCalledWith(
    SPACE,
    NETWORK,
    ADDRESSES,
    SNAPSHOT
  );
  expect(result).toEqual({});
});

// Test case 2: Test for non-empty legacyDelegations and empty multiDelegations
test('Test for non-empty legacyDelegations and empty multiDelegations', async () => {
  // Mock the legacyDelegationStrategy and getMultiDelegations functions
  const legacyDelegationStrategy = mockLegacyDelegation({
    address1: 100,
    address2: 200
  });
  const getMultiDelegations = mockGetMultiDelegations({});

  // Call the strategy function
  const result = await strategy(
    SPACE,
    NETWORK,
    PROVIDER,
    ADDRESSES,
    OPTIONS,
    SNAPSHOT
  );

  // Expectations
  expect(legacyDelegationStrategy).toHaveBeenCalledWith(
    SPACE,
    NETWORK,
    PROVIDER,
    ADDRESSES,
    OPTIONS,
    SNAPSHOT
  );
  expect(getMultiDelegations).toHaveBeenCalledWith(
    SPACE,
    NETWORK,
    ADDRESSES,
    SNAPSHOT
  );
  expect(result).toEqual({ address1: 100, address2: 200 });
});

// Test case 3: Test for empty legacyDelegations and non-empty multiDelegations
test('Test for empty legacyDelegations and non-empty multiDelegations', async () => {
  // Mock the legacyDelegationStrategy and getMultiDelegations functions
  const legacyDelegationStrategy = mockLegacyDelegation({});
  const getMultiDelegations = mockGetMultiDelegations({
    address1: ['delegate1'],
    address2: ['delegate2']
  });

  // Mock the getScoresDirect function
  const getScoresDirect = mockGetScoresDirect([
    { delegate1: 50 },
    { delegate2: 100 }
  ]);

  // Call the strategy function
  const result = await strategy(
    SPACE,
    NETWORK,
    PROVIDER,
    ADDRESSES,
    OPTIONS,
    SNAPSHOT
  );

  // Expectations
  expect(legacyDelegationStrategy).toHaveBeenCalledWith(
    SPACE,
    NETWORK,
    PROVIDER,
    ADDRESSES,
    OPTIONS,
    SNAPSHOT
  );
  expect(getMultiDelegations).toHaveBeenCalledWith(
    SPACE,
    NETWORK,
    ADDRESSES,
    SNAPSHOT
  );
  expect(getScoresDirect).toHaveBeenCalledWith(
    SPACE,
    OPTIONS.strategies,
    NETWORK,
    PROVIDER,
    ['delegate1', 'delegate2'],
    SNAPSHOT
  );
  expect(result).toMatchObject({ address1: 50, address2: 100 });
});

// Test case 4: Test for non-empty legacyDelegations and non-empty multiDelegations
test('Test for non-empty legacyDelegations and non-empty multiDelegations', async () => {
  // Mock the legacyDelegationStrategy and getMultiDelegations functions
  const legacyDelegationStrategy = mockLegacyDelegation({
    address1: 100
  });
  const getMultiDelegations = mockGetMultiDelegations({
    address1: ['delegate1'],
    address2: ['delegate2']
  });

  // Mock the getScoresDirect function
  const getScoresDirect = mockGetScoresDirect([
    { delegate1: 50 },
    { delegate2: 100 }
  ]);

  // Call the strategy function
  const result = await strategy(
    SPACE,
    NETWORK,
    PROVIDER,
    ADDRESSES,
    OPTIONS,
    SNAPSHOT
  );

  // Expectations
  expect(legacyDelegationStrategy).toHaveBeenCalledWith(
    SPACE,
    NETWORK,
    PROVIDER,
    ADDRESSES,
    OPTIONS,
    SNAPSHOT
  );
  expect(getMultiDelegations).toHaveBeenCalledWith(
    SPACE,
    NETWORK,
    ADDRESSES,
    SNAPSHOT
  );
  expect(getScoresDirect).toHaveBeenCalledWith(
    SPACE,
    OPTIONS.strategies,
    NETWORK,
    PROVIDER,
    ['delegate1', 'delegate2'],
    SNAPSHOT
  );
  expect(result).toEqual({
    address1: 100,
    address2: 100
  });
});
