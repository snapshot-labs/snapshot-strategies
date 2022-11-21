import snapshot from '../src';
import { getVp } from '../src/utils/vp';

const strategyArg =
  process.env['npm_config_strategy'] ||
  process.argv
    .find((arg) => arg.includes('--strategy='))
    ?.split('--strategy=')
    .pop();
const strategy = Object.keys(snapshot.strategies).find((s) => strategyArg == s);
if (!strategy) throw 'Strategy not found';
const examples: any[] =
  require(`../src/strategies/${strategy}/examples-vp.json`).map((example) => [
    example.name,
    example
  ]);

describe(strategy, () => {
  it.each(examples)('%s', async (_, example) => {
    const scores = await getVp(
      example.address,
      example.network,
      example.strategies,
      example.snapshot,
      example.space,
      true
    );
    expect(scores.vp_by_strategy[0]).toBe(example.expectedVp);
  });
});
