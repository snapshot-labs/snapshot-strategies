import { strategy } from '../../../src/strategies/multidelegation';
import * as utils from '../../../src/utils';
import * as multiDelegationUtils from '../../../src/strategies/multidelegation/utils';
import { getDelegationAddresses } from '../../../src/strategies/multidelegation/utils';
import snapshot from '../../../src';
import { getAddress } from '@ethersproject/address';

const SNAPSHOT = 'latest';
const NETWORK = '1';
const PROVIDER = snapshot.utils.getProvider(NETWORK);
const SPACE = 'some.space.eth';
const OPTIONS = {
  polygonChain: 'mumbai',
  strategies: [
    {
      name: 'erc20-balance-of',
      params: {
        symbol: 'WMANA',
        address: '0xfd09cf7cfffa9932e33668311c4777cb9db3c9be',
        decimals: 18
      }
    },
    {
      name: 'erc721-with-multiplier',
      params: {
        symbol: 'LAND',
        address: '0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d',
        multiplier: 2000
      }
    },
    {
      name: 'decentraland-estate-size',
      params: {
        symbol: 'ESTATE',
        address: '0x959e104e1a4db6317fa58f8295f586e1a978c297',
        multiplier: 2000
      }
    },
    {
      name: 'multichain',
      params: {
        name: 'multichain',
        graphs: {
          '137':
            'https://api.thegraph.com/subgraphs/name/decentraland/blocks-matic-mainnet'
        },
        symbol: 'MANA',
        strategies: [
          {
            name: 'erc20-balance-of',
            params: {
              address: '0x0f5d2fb29fb7d3cfee444a200298f468908cc942',
              decimals: 18
            },
            network: '1'
          },
          {
            name: 'erc20-balance-of',
            params: {
              address: '0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4',
              decimals: 18
            },
            network: '137'
          }
        ]
      }
    },
    {
      name: 'erc721-with-multiplier',
      params: {
        symbol: 'NAMES',
        address: '0x2a187453064356c898cae034eaed119e1663acb8',
        multiplier: 100
      }
    },
    {
      name: 'decentraland-wearable-rarity',
      params: {
        symbol: 'WEARABLE',
        collections: [
          '0x32b7495895264ac9d0b12d32afd435453458b1c6',
          '0xd35147be6401dcb20811f2104c33de8e97ed6818',
          '0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd',
          '0xc1f4b0eea2bd6690930e6c66efd3e197d620b9c2',
          '0xf64dc33a192e056bb5f0e5049356a0498b502d50',
          '0xc3af02c0fd486c8e9da5788b915d6fff3f049866'
        ],
        multipliers: {
          epic: 10,
          rare: 5,
          mythic: 1000,
          uncommon: 1,
          legendary: 100
        }
      }
    },
    {
      name: 'decentraland-rental-lessors',
      params: {
        symbol: 'RENTAL',
        addresses: {
          land: '0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d',
          estate: '0x959e104e1a4db6317fa58f8295f586e1a978c297'
        },
        subgraphs: {
          rentals:
            'https://api.thegraph.com/subgraphs/name/decentraland/rentals-ethereum-mainnet',
          marketplace:
            'https://api.thegraph.com/subgraphs/name/decentraland/marketplace'
        },
        multipliers: {
          land: 2000,
          estateSize: 2000
        }
      }
    }
  ]
};
const SCORE_PER_STRATEGY = 10;
const DELEGATOR_SCORE = OPTIONS.strategies.length * SCORE_PER_STRATEGY;
const ADDRESS_N = '0x56d0B5eD3D525332F00C9BC938f93598ab16AAA7';
const ADDRESS_L = '0x49E4DbfF86a2E5DA27c540c9A9E8D2C3726E278F';
const ADDRESS_G = '0x4757cE43Dc5429B8F1A132DC29eF970E55Ae722B';
const ADDRESS_X = '0xd7539FCdC0aB79a7B688b04387cb128E75cb77Dc';
const ADDRESS_Y = '0x6E33e22f7aC5A4b58A93C7f6D8Da8b46c50A3E20';
const ADDRESS_A = '0xC9dA7343583fA8Bb380A6F04A208C612F86C7701';
const ADDRESS_GS = '0x2AC89522CB415AC333E64F52a1a5693218cEBD58';
const ADDRESS_Z = '0xd90c6f6D37716b1Cc4dd2B116be42e8683550F45';

function mockGetLegacyDelegations(result: string[][]) {
  return jest
    .spyOn(multiDelegationUtils, 'getLegacyDelegations')
    .mockResolvedValue(
      new Map(result.map((array) => [getAddress(array[0]), array[1]]))
    );
}

function mockGetMultiDelegations(result: [string, string[]][]) {
  return jest
    .spyOn(multiDelegationUtils, 'getPolygonMultiDelegations')
    .mockResolvedValue(
      new Map(result.map((array) => [getAddress(array[0]), array[1]]))
    );
}

function mockGetScoresDirect() {
  return jest
    .spyOn(utils, 'getScoresDirect')
    .mockImplementation(
      (
        space: string,
        strategies: any[],
        network: string,
        provider,
        addresses: string[]
      ) =>
        Promise.resolve(
          strategies.map(() => {
            return Object.fromEntries(
              addresses.map((address) => [address, SCORE_PER_STRATEGY])
            );
          })
        )
    );
}

function mockScore(delegator: string, delegatorScore: number) {
  jest
    .spyOn(utils, 'getScoresDirect')
    .mockResolvedValue([
      { [delegator]: delegatorScore },
      {},
      {},
      {},
      {},
      {},
      {}
    ]);
}

function mockGetScoresDirectNoWMANA() {
  return jest.spyOn(utils, 'getScoresDirect').mockResolvedValue([
    {},
    { [ADDRESS_G]: 2000 },
    {},
    {
      [ADDRESS_N]: 100,
      [ADDRESS_L]: 0,
      [ADDRESS_X]: 127.5,
      [ADDRESS_G]: 120,
      [ADDRESS_A]: 50
    },
    {},
    {},
    {}
  ]);
}

describe('multidelegation', () => {
  const ADDRESSES = [ADDRESS_N, ADDRESS_L, ADDRESS_Y, ADDRESS_G, ADDRESS_A];

  describe('when every address has a score of 10 for every strategy', () => {
    beforeEach(() => mockGetScoresDirect());

    describe('when there are some legacy delegations', () => {
      beforeEach(() => {
        mockGetLegacyDelegations([
          [ADDRESS_N, ADDRESS_L],
          [ADDRESS_L, ADDRESS_G],
          [ADDRESS_X, ADDRESS_Y],
          [ADDRESS_A, ADDRESS_G]
        ]);
      });

      describe('when there are some multi delegations overriding legacy delegations', () => {
        beforeEach(() => {
          mockGetMultiDelegations([
            [ADDRESS_L, [ADDRESS_A]],
            [ADDRESS_Z, [ADDRESS_L, ADDRESS_N]],
            [ADDRESS_GS, [ADDRESS_L]]
          ]);
        });

        it('returns a score for each received address', async () => {
          const result = await strategy(
            SPACE,
            NETWORK,
            PROVIDER,
            ADDRESSES,
            OPTIONS,
            SNAPSHOT
          );

          expect(Object.keys(result).length).toEqual(ADDRESSES.length);
        });

        it('returns the delegated score for each address', async () => {
          const result = await strategy(
            SPACE,
            NETWORK,
            PROVIDER,
            ADDRESSES,
            OPTIONS,
            SNAPSHOT
          );

          expect(result[ADDRESS_L]).toEqual(
            DELEGATOR_SCORE * 2 + DELEGATOR_SCORE / 2
          );
          expect(result[ADDRESS_N]).toEqual(DELEGATOR_SCORE / 2);
          expect(result[ADDRESS_A]).toEqual(DELEGATOR_SCORE);
          expect(result[ADDRESS_Y]).toEqual(DELEGATOR_SCORE);
          expect(result[ADDRESS_G]).toEqual(DELEGATOR_SCORE);
        });

        describe('when some of the input addresses are not checksummed', () => {
          const ADDRESS_LOWERCASE = ADDRESS_L.toLowerCase();

          it('should return the same calculated amount for the checksum address', async () => {
            const result = await strategy(
              SPACE,
              NETWORK,
              PROVIDER,
              [ADDRESS_LOWERCASE],
              OPTIONS,
              SNAPSHOT
            );

            expect(result[ADDRESS_L]).toEqual(
              DELEGATOR_SCORE * 2 + DELEGATOR_SCORE / 2
            );
            expect(result[ADDRESS_LOWERCASE]).toBeUndefined();
          });
        });
      });
    });
  });

  describe('when there is no scores for any address for a particular strategy', () => {
    beforeEach(() => {
      mockGetScoresDirectNoWMANA();
      mockGetLegacyDelegations([[ADDRESS_G, ADDRESS_L]]);
      mockGetMultiDelegations([[ADDRESS_G, [ADDRESS_N]]]);
    });

    it('should not throw', async () => {
      const result = await strategy(
        SPACE,
        NETWORK,
        PROVIDER,
        [ADDRESS_L, ADDRESS_N],
        OPTIONS,
        SNAPSHOT
      );

      expect(result[ADDRESS_L]).toEqual(0);
      expect(result[ADDRESS_N]).toEqual(2120);
    });
  });

  describe('when there are no legacy delegations', () => {
    beforeEach(() => {
      mockGetScoresDirectNoWMANA();
      mockGetLegacyDelegations([]);
      mockGetMultiDelegations([[ADDRESS_G, [ADDRESS_N]]]);
    });

    it('should not throw', async () => {
      const result = await strategy(
        SPACE,
        NETWORK,
        PROVIDER,
        [ADDRESS_L, ADDRESS_N],
        OPTIONS,
        SNAPSHOT
      );

      expect(result[ADDRESS_N]).toEqual(2120);
      expect(result[ADDRESS_L]).toEqual(0);
    });
  });

  describe('when there are only legacy delegations', () => {
    beforeEach(() => {
      mockGetScoresDirectNoWMANA();
      mockGetLegacyDelegations([[ADDRESS_G, ADDRESS_L]]);
      mockGetMultiDelegations([]);
    });

    it('should not throw', async () => {
      const result = await strategy(
        SPACE,
        NETWORK,
        PROVIDER,
        [ADDRESS_L, ADDRESS_N],
        OPTIONS,
        SNAPSHOT
      );

      expect(result[ADDRESS_L]).toEqual(2120);
      expect(result[ADDRESS_N]).toEqual(0);
    });
  });

  describe('when there are no delegations', () => {
    beforeEach(() => {
      mockGetScoresDirectNoWMANA();
      mockGetLegacyDelegations([]);
      mockGetMultiDelegations([]);
    });

    it('should not throw', async () => {
      const result = await strategy(
        SPACE,
        NETWORK,
        PROVIDER,
        [ADDRESS_L, ADDRESS_N],
        OPTIONS,
        SNAPSHOT
      );

      expect(result[ADDRESS_L]).toEqual(0);
      expect(result[ADDRESS_N]).toEqual(0);
    });
  });

  describe('when there are multidelegations', () => {
    const DELEGATES = [ADDRESS_L, ADDRESS_N];
    const DELEGATOR_SCORE = 1000;
    beforeEach(() => {
      jest.clearAllMocks();
      mockGetMultiDelegations([[ADDRESS_G, DELEGATES]]);
      mockScore(ADDRESS_G, DELEGATOR_SCORE);
    });
    it('should split the scores equally between the delegators', async () => {
      const result = await strategy(
        SPACE,
        NETWORK,
        PROVIDER,
        [ADDRESS_L, ADDRESS_N],
        OPTIONS,
        SNAPSHOT
      );
      expect(result[ADDRESS_L]).toEqual(DELEGATOR_SCORE / DELEGATES.length);
      expect(result[ADDRESS_N]).toEqual(DELEGATOR_SCORE / DELEGATES.length);
    });
  });

  describe('when the delegator score is 0', () => {
    const DELEGATES = [ADDRESS_L, ADDRESS_N];
    const DELEGATOR_SCORE = 0;
    beforeEach(() => {
      jest.clearAllMocks();
      mockGetMultiDelegations([[ADDRESS_G, DELEGATES]]);
      mockScore(ADDRESS_G, DELEGATOR_SCORE);
    });
    it('should be 0 for all delegates', async () => {
      const result = await strategy(
        SPACE,
        NETWORK,
        PROVIDER,
        [ADDRESS_L, ADDRESS_N],
        OPTIONS,
        SNAPSHOT
      );
      expect(result[ADDRESS_L]).toEqual(0);
      expect(result[ADDRESS_N]).toEqual(0);
    });
  });

  describe('when there are empty delegations in polygon', () => {
    const DELEGATES = [];
    const DELEGATOR_SCORE = 1000;
    beforeEach(() => {
      jest.clearAllMocks();
      mockGetLegacyDelegations([[ADDRESS_G, ADDRESS_L]]);
      mockGetMultiDelegations([[ADDRESS_G, DELEGATES]]);
      mockScore(ADDRESS_G, DELEGATOR_SCORE);
    });
    it('uses the legacy delegation as fallback', async () => {
      const result = await strategy(
        SPACE,
        NETWORK,
        PROVIDER,
        [ADDRESS_L, ADDRESS_N, ADDRESS_G],
        OPTIONS,
        SNAPSHOT
      );
      expect(result[ADDRESS_L]).toEqual(DELEGATOR_SCORE);
      expect(result[ADDRESS_N]).toEqual(0);
      expect(result[ADDRESS_G]).toEqual(0);
    });
  });

  describe('when the delegation strategy is called without strategies', () => {
    const EMPTY_OPTIONS = {};
    it('returns a score for each received address', async () => {
      const result = await strategy(
        SPACE,
        NETWORK,
        PROVIDER,
        ADDRESSES,
        EMPTY_OPTIONS,
        SNAPSHOT
      );

      expect(Object.keys(result).length).toEqual(ADDRESSES.length);
      expect(result[ADDRESSES[0]]).toEqual(0);
    });
  });
});

describe('getDelegationAddresses', () => {
  describe('when it receives a list of addresses with repeated delegations', () => {
    const reversedDelegations = new Map([
      [ADDRESS_L, [ADDRESS_N, ADDRESS_Z, ADDRESS_GS]],
      [ADDRESS_A, [ADDRESS_L]],
      [ADDRESS_Y, [ADDRESS_X]],
      [ADDRESS_G, [ADDRESS_A]],
      [ADDRESS_N, [ADDRESS_Z]]
    ]);
    it('does not include repeated addresses', () => {
      expect(getDelegationAddresses(reversedDelegations)).toEqual([
        ADDRESS_N,
        ADDRESS_Z,
        ADDRESS_GS,
        ADDRESS_L,
        ADDRESS_X,
        ADDRESS_A
      ]);
    });
  });
});
