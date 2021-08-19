const { JsonRpcProvider } = require('@ethersproject/providers');
const snapshot = require('../').default;
const networks = require('../src/networks.json');

const space = 'ocean';
const network = '1';

const strategies = [
  {
    name: 'erc20-balance-of',
    params: {
      symbol: 'OCEAN',
      address: '0x967da4048cD07aB37855c090aAF366e4ce1b9F48',
      decimals: 18
    }
  },
  {
    name: 'ocean-marketplace',
    params: {
      symbol: 'OCEAN',
      address: '0x967da4048cD07aB37855c090aAF366e4ce1b9F48',
      decimals: 18
    }
  },
  {
    name: 'sushiswap',
    params: {
      symbol: 'OCEAN',
      address: '0x967da4048cD07aB37855c090aAF366e4ce1b9F48',
      decimals: 18
    }
  },
  {
    name: 'uniswap',
    params: {
      symbol: 'OCEAN',
      address: '0x967da4048cD07aB37855c090aAF366e4ce1b9F48',
      decimals: 18
    }
  },
  {
    name: 'contract-call',
    params: {
      address: '0x9712Bb50DC6Efb8a3d7D12cEA500a50967d2d471',
      args: [
        '%{address}',
        '0xCDfF066eDf8a770E9b6A7aE12F7CFD3DbA0011B5',
        '0x967da4048cD07aB37855c090aAF366e4ce1b9F48'
      ],
      decimals: 18,
      symbol: 'OCEAN',
      methodABI: {
        inputs: [
          {
            internalType: 'address',
            name: 'provider',
            type: 'address'
          },
          {
            internalType: 'address',
            name: 'poolToken',
            type: 'address'
          },
          {
            internalType: 'address',
            name: 'reserveToken',
            type: 'address'
          }
        ],
        name: 'totalProviderAmount',
        outputs: [
          {
            internalType: 'uint256',
            name: '',
            type: 'uint256'
          }
        ],
        stateMutability: 'view',
        type: 'function'
      }
    }
  }
];

// [0] => ERC20
// [1] => Ocean Marketplace
// [2] => Sushiswap
// [3] => Uniswap
// [4] => Bancor
const addresses = [
  // ERC-20 - 325.9642552813115
  // Uniswap LP - 2.5914096066900663
  '0x005241438cAF3eaCb05bB6543151f7AF894C5B58',

  // ERC-20 - 5695.410954916474
  // Ocean Marketplace LP - 4164.931866504933
  // Bancor LP - 49267.088663994866
  '0x5D2B315C465e133a346C960F46f5AA1ED88a3179',

  // ERC-20 - 0
  // Sushiswap LP - 963.8962295973731
  // Bancor LP - 0
  '0x477336e94655a1fd0b0aa3945f26236f7555fa28'
];

(async () => {
  console.time('getScores');
  try {
    const scores = await snapshot.utils.getScoresDirect(
      space,
      strategies,
      network,
      new JsonRpcProvider(networks[network].rpc[0]),
      addresses,
      13003759
    );
    console.log(scores);
  } catch (e) {
    console.log('getScores failed');
    console.error(e);
  }
  console.timeEnd('getScores');
})();
