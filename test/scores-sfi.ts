const { JsonRpcProvider } = require('@ethersproject/providers');
const snapshot = require('../').default;
const networks = require('@snapshot-labs/snapshot.js/src/networks.json');

const space = 'turpintinz.eth';
const network = '1';
const snapshotBlockNumber = 13585170;
const strategies = [
  {
    "name": "saffron-finance-v2",
    "params": {
      "address": "0xb753428af26e81097e7fd17f40c88aaa3e04902c",
      "symbol": "SFI",
      "decimals": 18,
      "multiplier": 1.1
    }
  },
  {
    "name": "saffron-finance",
    "params": {
      "symbol": "SFI",
      "votingSchemes": [
        {
          "name": "oneToOne",
          "type": "DirectBoostScheme",
          "multiplier": 1.0
        },
        {
          "name": "staking",
          "type": "DirectBoostScheme",
          "multiplier": 1.1
        },
        {
          "name": "uniswap",
          "type": "LPReservePairScheme",
          "multiplier": 1.1
        },
        {
          "name": "sushiswap",
          "type": "LPReservePairScheme",
          "multiplier": 1.1
        }
      ],
      "dexLpTypes": [
        {
          "name": "uniswap",
          "lpToken": "0xC76225124F3CaAb07f609b1D147a31de43926cd6"
        },
        {
          "name": "sushiswap",
          "lpToken": "0x23a9292830Fc80dB7f563eDb28D2fe6fB47f8624"
        }
      ],
      "contracts": [
        {
          "votingScheme": "oneToOne",
          "label": "SFI",
          "tokenAddress": "0xb753428af26e81097e7fd17f40c88aaa3e04902c"
        },
        {
          "votingScheme": "oneToOne",
          "label": "TEAM_HODL_TOKEN",
          "tokenAddress": "0x4e5ee20900898054e998fd1862742c28c651bf5d"
        }
      ]
    }
  }
];
const addresses = [
  '0xD90B866039E8820c2Cd082840fceeD81Cef691F8',
  '0x905D6a479C4be28aF08364CE1c8e02eBC9c4bdA8',
  '0x64eacbcdbc6123bcc8b90a5fde8dd099aadb0e56',
  '0x7ba163a38a1fb4bd62096f6a76ef332f89aacf2f',
  '0x8d452c1f4bae385b13933c83ecff70d74229915f',
  '0x91dca37856240e5e1906222ec79278b16420dc92',
  '0x1c7a9275F2BD5a260A9c31069F77d53473b8ae2e',
  '0x3478697c64578D3D8092925EE365168CcabfeB66',
  '0x905D6a479C4be28aF08364CE1c8e02eBC9c4bdA8',
  '0x2ec3F80BeDA63Ede96BA20375032CDD3aAfb3030',
  '0x4AcBcA6BE2f8D2540bBF4CA77E45dA0A4a095Fa2',
  '0x4F3D348a6D09837Ae7961B1E0cEe2cc118cec777',
  '0x6D7f23A509E212Ba7773EC1b2505d1A134f54fbe',
  '0x07a1f6fc89223c5ebD4e4ddaE89Ac97629856A0f',
  '0x8d5F05270da470e015b67Ab5042BDbE2D2FEFB48',
  '0x8d07D225a769b7Af3A923481E1FdF49180e6A265',
  '0x8f60501dE5b9b01F9EAf1214dbE1924aA97F7fd0',
  '0x9B8e8dD9151260c21CB6D7cc59067cd8DF306D58',
  '0x17ea92D6FfbAA1c7F6B117c1E9D0c88ABdc8b84C',
  '0x38C0039247A31F3939baE65e953612125cB88268',
  '0x8e3c49ddfe7e2dbd7682ae548330e70f4bd1cdca',
  '0xaf13c03942bd185ffb687141563c1da508bed79e'
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
      snapshotBlockNumber
    );
    console.log(scores);
  } catch (e) {
    console.log('getScores failed');
    console.error(e);
  }
  console.timeEnd('getScores');
})();
