import { getProvider } from '../../utils';
import strategies from '..';

export const author = 'xJonathanLEI';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const upstreamResult: Record<string, number> = await strategies[
    options.strategy.name
  ].strategy(
    space,
    options.strategy.network,
    getProvider(options.strategy.network),
    addresses,
    options.strategy.params,
    snapshot
  );

  let scoreConverter: (score: number) => number;
  switch (options.operation) {
    case 'square-root': {
      scoreConverter = (score) => Math.sqrt(score);
      break;
    }
    case 'cube-root': {
      scoreConverter = (score) => Math.cbrt(score);
      break;
    }
    default: {
      throw new Error(`Unknown math operation: ${options.operation}`);
    }
  }

  return Object.fromEntries(
    Object.entries(upstreamResult).map(([address, score]) => [
      address,
      scoreConverter(score)
    ])
  );
}
