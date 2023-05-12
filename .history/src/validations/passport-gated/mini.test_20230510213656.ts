import snapshotjs from '@snapshot-labs/snapshot.js';
import fetch from 'cross-fetch';
import examples from './examples.json';

const id = 'passport-gated';
const validationConstructor = snapshot.validations[id].validation;

describe('Validation', () => {
  it(`validate: ${id}`, async () => {
    const example = examples[0];
    const validation = new validationConstructor(
      example.author,
      example.space,
      example.network,
      example.snapshot,
      example.params
    );
    expect(await validation.validate()).toBe(true);
  }, 30e3);

  // Check schema is valid with examples.json
  let schema;
  try {
    schema = require('./schema.json');
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

describe(`Others:`, () => {
  it('github in strategy should be a valid github username', async () => {
    const github = snapshot.validations[id].github;
    expect(typeof github).toBe('string');
    const githubUserData = await fetch(
      `https://api.github.com/users/${github}`
    );
    const githubUser = await githubUserData.json();
    expect(githubUser.message).not.toEqual('Not Found');
  });
  it('Version in strategy should be a valid string', async () => {
    const version = snapshot.validations[id].version;
    expect(typeof version).toBe('string');
  });
});
