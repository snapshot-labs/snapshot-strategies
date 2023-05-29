import { strategy } from '../src/strategies/multidelegation';
import * as utils from '../src/utils';
import * as multiDelegationUtils from '../src/strategies/multidelegation/utils';
import { getDelegationAddresses } from '../src/strategies/multidelegation/utils';
import snapshot from '../src';
import { getAddress } from '@ethersproject/address';

const SNAPSHOT = 'latest';
const NETWORK = '1';
const PROVIDER = snapshot.utils.getProvider(NETWORK);
const SPACE = 'some.space.eth';
const OPTIONS = {
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

function mockGetLegacyDelegations(result: string[][]) {
  return jest
    .spyOn(multiDelegationUtils, 'getLegacyDelegations')
    .mockResolvedValue(
      new Map(result.map((array) => [getAddress(array[0]), array[1]]))
    );
}

function mockGetMultiDelegations(result: [string, string[]][]) {
  return jest
    .spyOn(multiDelegationUtils, 'getMultiDelegations')
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

const ADDRESS_N = '0x6Cd7694d30c10bdAB1E644FC1964043a95cEEa5F';
const ADDRESS_L = '0x549A9021661a85B6BC51c07B3A451135848d0048';
const ADDRESS_G = '0x511a22cDd2c4eE8357bB02df2578037Ffe8a4d8d';
const ADDRESS_X = '0x30b1f4Bd5476906f38385B891f2c09973196b742';
const ADDRESS_Y = '0x0f051A642A1c4B2c268C7D6a83186159b149021b';
const ADDRESS_A = '0xb0F847e61C502Fb82D758C515b3F914de42831D5';
const ADDRESS_GS = '0xBf363AeDd082Ddd8DB2D6457609B03f9ee74a2F1';
const ADDRESS_Z = '0x76DA87b314aa6878d06344eE14fcd1bBB7E8FDb5';

describe('multidelegation', () => {
  const ADDRESSES = [ADDRESS_N, ADDRESS_L, ADDRESS_Y, ADDRESS_G, ADDRESS_A];
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

        expect(result[ADDRESS_L]).toEqual(DELEGATOR_SCORE * 3);
        expect(result[ADDRESS_N]).toEqual(DELEGATOR_SCORE);
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

          expect(result[ADDRESS_L]).toEqual(DELEGATOR_SCORE * 3);
          expect(result[ADDRESS_LOWERCASE]).toBeUndefined();
        });
      });
    });
  });
});

describe('getDelegationAddresses', () => {
  describe('when it receives a list of addresses with repeated delegations', () => {
    const reversedDelegations = new Map([
      [
        '0x549A9021661a85B6BC51c07B3A451135848d0048',
        [
          '0x6Cd7694d30c10bdAB1E644FC1964043a95cEEa5F',
          '0x76DA87b314aa6878d06344eE14fcd1bBB7E8FDb5',
          '0xBf363AeDd082Ddd8DB2D6457609B03f9ee74a2F1'
        ]
      ],
      [
        '0xb0F847e61C502Fb82D758C515b3F914de42831D5',
        ['0x549A9021661a85B6BC51c07B3A451135848d0048']
      ],
      [
        '0x0f051A642A1c4B2c268C7D6a83186159b149021b',
        ['0x30b1f4Bd5476906f38385B891f2c09973196b742']
      ],
      [
        '0x511a22cDd2c4eE8357bB02df2578037Ffe8a4d8d',
        ['0xb0F847e61C502Fb82D758C515b3F914de42831D5']
      ],
      [
        '0x6Cd7694d30c10bdAB1E644FC1964043a95cEEa5F',
        ['0x76DA87b314aa6878d06344eE14fcd1bBB7E8FDb5']
      ]
    ]);
    it('does not include repeated addresses', () => {
      expect(getDelegationAddresses(reversedDelegations)).toEqual([
        '0x6Cd7694d30c10bdAB1E644FC1964043a95cEEa5F',
        '0x76DA87b314aa6878d06344eE14fcd1bBB7E8FDb5',
        '0xBf363AeDd082Ddd8DB2D6457609B03f9ee74a2F1',
        '0x549A9021661a85B6BC51c07B3A451135848d0048',
        '0x30b1f4Bd5476906f38385B891f2c09973196b742',
        '0xb0F847e61C502Fb82D758C515b3F914de42831D5'
      ]);
    });
  });
});
