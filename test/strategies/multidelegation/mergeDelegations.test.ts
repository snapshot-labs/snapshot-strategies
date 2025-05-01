import { mergeDelegations } from '../../../src/strategies/multidelegation/utils';

describe('when both legacyDelegations and multiDelegations are empty objects', () => {
  it('returns an empty object', () => {
    const legacyDelegations = new Map<string, string>();
    const multiDelegations = new Map();
    const mergedDelegations = mergeDelegations(
      legacyDelegations,
      multiDelegations
    );
    expect(mergedDelegations).toEqual(new Map());
  });
});

describe('when legacyDelegations is not an empty object and multiDelegations is an empty object', () => {
  it('returns legacy delegations', () => {
    const legacyDelegations = new Map([
      ['0x123', '0x456'],
      ['0x789', '0xabc']
    ]);
    const multiDelegations = new Map();
    const mergedDelegations = mergeDelegations(
      legacyDelegations,
      multiDelegations
    );
    expect(mergedDelegations).toEqual(
      new Map([
        ['0x123', ['0x456']],
        ['0x789', ['0xabc']]
      ])
    );
  });
});

describe('when legacyDelegations is an empty object and multiDelegations is not an empty object', () => {
  it('returns multi delegations', () => {
    const legacyDelegations = new Map<string, string>();
    const multiDelegations = new Map([
      ['0x123', ['0x456', '0x789']],
      ['0xxyz', ['0xabc']]
    ]);
    const mergedDelegations = mergeDelegations(
      legacyDelegations,
      multiDelegations
    );
    expect(mergedDelegations).toEqual(
      new Map([
        ['0x123', ['0x456', '0x789']],
        ['0xxyz', ['0xabc']]
      ])
    );
  });
});

describe('when legacyDelegations and multiDelegations have no common keys', () => {
  it('returns merged delegations', () => {
    const legacyDelegations = new Map([
      ['0x123', '0x456'],
      ['0x789', '0xabc']
    ]);
    const multiDelegations = new Map([['0xxyz', ['0xdef']]]);
    const mergedDelegations = mergeDelegations(
      legacyDelegations,
      multiDelegations
    );
    expect(mergedDelegations).toEqual(
      new Map([
        ['0x123', ['0x456']],
        ['0x789', ['0xabc']],
        ['0xxyz', ['0xdef']]
      ])
    );
  });
});

describe('when legacyDelegations and multiDelegations have some common keys', () => {
  it('returns merged delegations', () => {
    const legacyDelegations = new Map([
      ['0x123', '0x456'],
      ['0x789', '0xabc']
    ]);
    const multiDelegations = new Map([
      ['0x123', ['0x789', '0xdef']],
      ['0xxyz', ['0x123']]
    ]);
    const mergedDelegations = mergeDelegations(
      legacyDelegations,
      multiDelegations
    );
    expect(mergedDelegations).toEqual(
      new Map([
        ['0x123', ['0x789', '0xdef']],
        ['0x789', ['0xabc']],
        ['0xxyz', ['0x123']]
      ])
    );
  });
});

describe('when legacyDelegations or multiDelegations is null or undefined', () => {
  it('returns an empty object', () => {
    const legacyDelegations = null;
    const multiDelegations = undefined;
    const mergedDelegations = mergeDelegations(
      legacyDelegations as any,
      multiDelegations as any
    );
    expect(mergedDelegations).toEqual(new Map());
  });
});

describe('when a multiDelegation has an empty array and has a common key with legacyDelegations', () => {
  it('returns merged delegations', () => {
    const legacyDelegations = new Map([
      ['0x123', '0x456'],
      ['0x789', '0xabc']
    ]);
    const multiDelegations = new Map([
      ['0x123', []],
      ['0xxyz', ['0x123']]
    ]);
    const mergedDelegations = mergeDelegations(
      legacyDelegations,
      multiDelegations
    );
    expect(mergedDelegations).toEqual(
      new Map([
        ['0x123', ['0x456']],
        ['0x789', ['0xabc']],
        ['0xxyz', ['0x123']]
      ])
    );
  });
});

describe('when a multiDelegation has an empty array and has no common key with legacyDelegations', () => {
  it('returns merged delegations', () => {
    const legacyDelegations = new Map([
      ['0x123', '0x456'],
      ['0x789', '0xabc']
    ]);
    const multiDelegations = new Map([['0xxyz', []]]);
    const mergedDelegations = mergeDelegations(
      legacyDelegations,
      multiDelegations
    );
    expect(mergedDelegations).toEqual(
      new Map([
        ['0x123', ['0x456']],
        ['0x789', ['0xabc']]
      ])
    );
  });
});
