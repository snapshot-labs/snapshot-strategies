const snapshot = require('../').default;

const space = 'cvx.eth';
const network = '1';
const addresses = ['0x038ae33f4bbfd9e0489abd7e622f014244433f72'];

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
