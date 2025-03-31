// To test strategies by copy pasting score API body here
import snapshot from '../src';

const scoreAPIObj = {
  params: {
    space: '',
    network: '8453',
    snapshot: 26837273,
    strategies: [
      {
        name: 'erc721-with-metadata-by-ownerof',
        params: {
          symbol: 'OTCBOX',
          address: '0x812271d684328443287312793757C4f32848A70A',
          metadataSrc:
            'https://s3.us-west-2.amazonaws.com/cdn.earnm.com/nft/otcbox/otc_boxes_voting_weights.json'
        }
      }
    ],
    addresses: [
      '0x030fBBD3ce096195c8c83bb8BfB70704eed865F9',
      '0xb0b085dd0fe6c9632058f9ef088375c16f3aff12',
      '0x7f16D5c969380E3420E17B4c3456A3844745A578'
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
