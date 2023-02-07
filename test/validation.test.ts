import snapshotjs from '@snapshot-labs/snapshot.js';
import fetch from 'cross-fetch';
import snapshot from '../src';

const validationArg =
  process.env['npm_config_strategy'] ||
  (
    process.argv.find((arg) => arg.includes('--validation=')) ||
    '--validation=passport-gated'
  )
    .split('--validation=')
    .pop();

const id = Object.keys(snapshot.validations).find(
  (validation) => validationArg === validation
);
if (!id) throw 'Validation not found';

const examples = require(`../src/validations/${id}/examples.json`).map(
  (example, index) => ({ index, example })
);

const [{ example }] = examples;

describe('Validation', () => {
  it(`validate: ${id}`, async () => {
    const validation = new snapshot.validations[id].validation(
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

describe('All validations', () => {
  it('All validations should have unique id and title', () => {
    const ids = Object.keys(snapshot.validations).map(
      (validation) => snapshot.validations[validation].id
    );
    const titles = Object.keys(snapshot.validations).map(
      (validation) => snapshot.validations[validation].title
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('All validations should have examples.json', () => {
    Object.keys(snapshot.validations).forEach((validation) => {
      expect(
        require(`../src/validations/${validation}/examples.json`)
      ).toBeTruthy();
    });
  });

  it('All validations should have a non-empty id, title, description, github and version', () => {
    // Loop through all validations, and check that each has a non-empty id, title, description, github and version
    Object.keys(snapshot.validations).forEach((validation) => {
      const { id, title, description, github, version } =
        snapshot.validations[validation];
      expect(id).toBeTruthy();
      expect(title).toBeTruthy();
      expect(description).toBeTruthy();
      expect(github).toBeTruthy();
      expect(version).toBeTruthy();

      // Check that the version is in the correct format
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});

describe(`\nOthers:`, () => {
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
