// To test strategies by copy pasting score API body here
import snapshot from '../src';

const scoreAPIObj = {
  params: {
    space: 'snapshot.dcl.eth',
    network: '1',
    snapshot: 'latest',
    strategies: [
      {
        name: 'delegation',
        network: '1',
        params: {
          symbol: 'VP (delegated)',
          strategies: [
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
            }
          ]
        }
      }
    ],
    addresses: [
      '0x2011c83e8f75c0ceb90ec140d8e8adfc836e3685'
    ]
  }
};

const provider = snapshot.utils.getProvider(scoreAPIObj.params.network);
snapshot.utils
  .getScoresDirect(
    scoreAPIObj.params.space,
    scoreAPIObj.params.strategies,
    scoreAPIObj.params.network,
    provider,
    scoreAPIObj.params.addresses,
    scoreAPIObj.params.snapshot
  )
  .then(console.log)
  .then(() => {
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  })
  .catch(console.error);
