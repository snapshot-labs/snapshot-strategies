import snapshot from '../../src';

const space = 'cvx.eth';
const network = '1';
const addresses = ['0xde1E6A7ED0ad3F61D531a8a78E83CcDdbd6E0c49'];

(async () => {
  console.time('getDelegations');
  try {
    const scores = await snapshot.utils.getDelegations(
      space,
      network,
      addresses,
      13413053
    );
    console.log(scores);
  } catch (e) {
    console.log('getDelegations failed');
    console.error(e);
  }
  console.timeEnd('getDelegations');
})();
