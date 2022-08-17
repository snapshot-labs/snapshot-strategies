import { getAddress } from '@ethersproject/address';
import { performance } from 'perf_hooks';
import fetch from 'cross-fetch';
import snapshot from '../src';
import snapshotjs from '@snapshot-labs/snapshot.js';
import addresses from './addresses.json';

const strategyArg =
  process.env['npm_config_strategy'] ||
  (
    process.argv.find((arg) => arg.includes('--strategy=')) ||
    '--strategy=erc20-balance-of'
  )
    .split('--strategy=')
    .pop();

const moreArg: string | undefined =
  process.env['npm_config_more'] ||
  process.argv
    .find((arg) => arg.includes('--more='))
    ?.split('--more=')
    ?.pop();

const strategy = Object.keys(snapshot.strategies).find((s) => strategyArg == s);
if (!strategy) throw 'Strategy not found';
const example = require(`../src/strategies/${strategy}/examples.json`)[0];

function callGetScores(example) {
  const provider = snapshot.utils.getProvider(example.network);
  return snapshot.utils.getScoresDirect(
    'yam.eth',
    [example.strategy],
    example.network,
    provider,
    example.addresses,
    example.snapshot
  );
}

describe(`\nTest strategy "${strategy}"`, () => {
  let scores: any = null;
  let getScoresTime: number | null = null;

  it('Strategy name should be lowercase and should not contain any special char expect hyphen', () => {
    expect(strategy).toMatch(/^[a-z0-9\-]+$/);
  });

  it('Strategy name should be same as in examples.json', () => {
    expect(example.strategy.name).toBe(strategy);
  });

  it('Strategy should run without any errors', async () => {
    const getScoresStart = performance.now();
    scores = await callGetScores(example);
    const getScoresEnd = performance.now();
    getScoresTime = getScoresEnd - getScoresStart;
    console.log(scores);
    console.log(`Resolved in ${(getScoresTime / 1e3).toFixed(2)} sec.`);
  }, 2e4);

  it('Should return an array of object with addresses', () => {
    expect(scores).toBeTruthy();
    // Check array
    expect(Array.isArray(scores)).toBe(true);
    // Check array contains a object
    expect(typeof scores[0]).toBe('object');
    // Check object contains at least one address from example.json
    expect(Object.keys(scores[0]).length).toBeGreaterThanOrEqual(1);
    expect(
      Object.keys(scores[0]).some((address) =>
        example.addresses
          .map((v) => v.toLowerCase())
          .includes(address.toLowerCase())
      )
    ).toBe(true);
    // Check if all scores are numbers
    expect(
      Object.values(scores[0]).every((val) => typeof val === 'number')
    ).toBe(true);
  });

  it('Should take less than 10 sec. to resolve', () => {
    expect(getScoresTime).toBeLessThanOrEqual(10000);
  });

  it('File examples.json should include at least 1 address with a positive score', () => {
    expect(Object.values(scores[0]).some((score: any) => score > 0)).toBe(true);
  });

  it('File examples.json must use a snapshot block number in the past', async () => {
    expect(typeof example.snapshot).toBe('number');
    const provider = snapshot.utils.getProvider(example.network);
    const blockNumber = await snapshot.utils.getBlockNumber(provider);
    expect(example.snapshot).toBeLessThanOrEqual(blockNumber);
  });

  it('Returned addresses should be either same case as input addresses or checksum addresses', () => {
    expect(
      Object.keys(scores[0]).every(
        (address) =>
          example.addresses.includes(address) || getAddress(address) === address
      )
    ).toBe(true);
  });
});

describe(`\nTest strategy "${strategy}" with latest snapshot`, () => {
  let scores: any = null;
  let getScoresTime: number | null = null;
  it('Strategy should run without any errors', async () => {
    const getScoresStart = performance.now();
    scores = await callGetScores({ ...example, snapshot: 'latest' });
    const getScoresEnd = performance.now();
    getScoresTime = getScoresEnd - getScoresStart;
    console.log('Scores with latest snapshot', scores);
    console.log(`Resolved in ${(getScoresTime / 1e3).toFixed(2)} sec.`);
    // wait for all logs to be printed (bug: printed after results)
    await new Promise((r) => setTimeout(r, 500));
  }, 2e4);

  it('Should return an array of object with addresses', () => {
    expect(scores).toBeTruthy();
    // Check array
    expect(Array.isArray(scores)).toBe(true);
    // Check array contains a object
    expect(typeof scores[0]).toBe('object');
    // Check object contains atleast one address from example.json
    expect(Object.keys(scores[0]).length).toBeGreaterThanOrEqual(1);
    expect(
      Object.keys(scores[0]).some((address) =>
        example.addresses
          .map((v) => v.toLowerCase())
          .includes(address.toLowerCase())
      )
    ).toBe(true);

    // Check if all scores are numbers
    expect(
      Object.values(scores[0]).every((val) => typeof val === 'number')
    ).toBe(true);
  });
});

(moreArg ? describe : describe.skip)(
  `\nTest strategy "${strategy}" (with ${moreArg || 500} addresses)`,
  () => {
    let scoresMore: any = null;
    let getScoresTimeMore: number | null = null;

    it(`Should work with ${moreArg || 500} addresses`, async () => {
      example.addresses = addresses.slice(0, Number(moreArg));
      const getScoresStart = performance.now();
      scoresMore = await callGetScores(example);
      const getScoresEnd = performance.now();
      getScoresTimeMore = getScoresEnd - getScoresStart;
      console.log(`Scores with ${moreArg || 500} addresses`, scoresMore);
      console.log(`Resolved in ${(getScoresTimeMore / 1e3).toFixed(2)} sec.`);
      // wait for all logs to be printed (bug: printed after results)
      await new Promise((r) => setTimeout(r, 500));
    });

    it(`Should take less than 20 sec. to resolve with ${
      moreArg || 500
    } addresses`, () => {
      expect(getScoresTimeMore).toBeLessThanOrEqual(20000);
    });
  }
);

describe(`\nOthers:`, () => {
  it('Author in strategy should be a valid github username', async () => {
    const author = snapshot.strategies[strategy].author;
    expect(typeof author).toBe('string');
    const githubUserData = await fetch(
      `https://api.github.com/users/${author}`
    );
    const githubUser = await githubUserData.json();
    expect(githubUser.message).not.toEqual('Not Found');
  });
  it('Version in strategy should be a valid string', async () => {
    const version = snapshot.strategies[strategy].author;
    expect(typeof version).toBe('string');
  });

  let schema;
  try {
    schema = require(`../src/strategies/${strategy}/schema.json`);
  } catch (error) {
    schema = null;
  }
  (schema ? it : it.skip)(
    'Check schema (if available) is valid with examples.json',
    async () => {
      expect(typeof schema).toBe('object');
      expect(
        snapshotjs.utils.validateSchema(schema, example.strategy.params)
      ).toBe(true);
    }
  );
  (schema ? it : it.skip)(
    'Strategy should work even when strategy symbol is null',
    async () => {
      delete example.strategy.params.symbol;
      expect(
        snapshotjs.utils.validateSchema(schema, example.strategy.params)
      ).toBe(true);
    }
  );
});
