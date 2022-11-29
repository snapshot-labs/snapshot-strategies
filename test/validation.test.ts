import snapshotjs from '@snapshot-labs/snapshot.js';
import snapshot from '../src';
import examples from '../src/validations/passport-gated/examples.json';

const [example] = examples;
const id = 'passport-gated';

describe('validation', () => {
  it(`validate: ${id} "${example.name}"`, async () => {
    const validation = new snapshot.validations[id].validation(
      example.author,
      example.space,
      example.network,
      example.snapshot,
      example.params
    );
    expect(await validation.validate()).toBe(true);
  }, 10e3);

  // Check schema is valid with examples.json
  let schema;
  try {
    schema = require(`../src/validations/${id}/schema.json`);
  } catch (error) {
    schema = null;
  }
  (schema ? it : it.skip)(
    'Check schema (if available) is valid with examples.json',
    async () => {
      expect(typeof schema).toBe('object');
      expect(snapshotjs.utils.validateSchema(schema, example.params)).toBe(
        true
      );
    }
  );
});
