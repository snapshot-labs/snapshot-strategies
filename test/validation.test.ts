import snapshot from '../src';
import examples from '../src/validations/basic/examples.json';

const [example] = examples;
const id = 'basic';

describe('validation', () => {
  it(`validate: ${id} "${example.name}"`, async () => {
    const validation = new snapshot.validations[id](
      example.author,
      example.space,
      example.network,
      example.snapshot,
      example.params
    );
    expect(await validation.validate()).toBe(true);
  }, 10e3);
});
