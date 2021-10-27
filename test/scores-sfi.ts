const { JsonRpcProvider } = require('@ethersproject/providers');
const snapshot = require('../').default;
const networks = require('@snapshot-labs/snapshot.js/src/networks.json');

const space = 'turpintinz.eth';
const network = '1';
const snapshotBlockNumber = 13497529;
const strategies = [
  {
    name: "masterchef-pool-balance-price",
    params: {
      symbol: "SFI-ETH UNI",
      chefAddress: "0x4eB4C5911e931667fE1647428F38401aB1661763",
      uniPairAddress: "0xC76225124F3CaAb07f609b1D147a31de43926cd6",
      token0: {
        address: "0xb753428af26E81097e7fD17f40c88aaA3E04902c",
        weight: 1,
        weightDecimals: 0
      },
      pid: "1",
      weight: 11,
      weightDecimals: 1
    }
  }
];
const addresses = [
  '0xD90B866039E8820c2Cd082840fceeD81Cef691F8',
  '0x905D6a479C4be28aF08364CE1c8e02eBC9c4bdA8'
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
