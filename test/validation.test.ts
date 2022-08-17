import snapshot from '../src';
import examples from '../src/validations/aave/examples.json';

const name = examples[0].validation.name;
const params = examples[0].validation.params || {};
const author = examples[0].userAddress;
const space = examples[0].space;
const proposal = {};

describe('', () => {
  it('validation', async () => {
    const validation = await snapshot.validations[name](
      author,
      space,
      proposal,
      params
    );
    expect(validation).toMatchSnapshot();
  }, 20e3);
});
