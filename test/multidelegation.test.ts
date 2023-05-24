// @ts-nocheck

import { strategy } from '../src/strategies/multidelegation/index';
// import { getScoresDirect } from '../src/utils';
import snapshot from '../src';

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
const SNAPSHOT = 'snapshot1';
//
// function mockLegacyDelegation(result: { [k: string]: any }) {
//   return jest
//     .spyOn(legacyDelegationStrategy, 'strategy')
//     .mockResolvedValue(result);
// }
//
// function mockGetMultiDelegations(result: { [k: string]: any }) {
//   return jest
//     .spyOn(multidelegationUtils, 'getMultiDelegations')
//     .mockResolvedValue(result);
// }
//
// function mockGetScoresDirect(result: Record<string, unknown>[]) {
//   return jest.spyOn(utils, 'getScoresDirect').mockResolvedValue(result);
// }

test('pruebita', async () => {
  const SNAPSHOT = 'latest';
  const NETWORK = '1';
  const PROVIDER = snapshot.utils.getProvider(NETWORK);
  const SPACE = '1emu.eth';
  const ADDRESSES = [
    '0x6Cd7694d30c10bdAB1E644FC1964043a95cEEa5F',
    '0x549A9021661a85B6BC51c07B3A451135848d0048',
    '0x30b1f4bd5476906f38385b891f2c09973196b742',
    '0x511a22cDd2c4eE8357bB02df2578037Ffe8a4d8d',
    '0xb0F847e61C502Fb82D758C515b3F914de42831D5'
  ];

  // [{address1: vp, address2: score}, {address1: 0}]

  const result = await strategy(
    SPACE,
    NETWORK,
    PROVIDER,
    ADDRESSES,
    OPTIONS,
    SNAPSHOT
  );

  console.log('result', JSON.stringify(result));
});
