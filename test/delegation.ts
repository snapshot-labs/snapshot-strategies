const snapshot = require('../').default;

const space = 'cvx.eth';
const network = '137';
const addresses = ['0x9Cf28Be69D1c88ff7ECC1D2332577CB9671aBF70'];

(async () => {
  console.time('getDelegations');
  try {
    const scores = await snapshot.utils.getDelegations(
      space,
      network,
      addresses,
      13995858
    );
    console.log(scores);
  } catch (e) {
    console.log('getDelegations failed');
    console.error(e);
  }
  console.timeEnd('getDelegations');
})();
