import { getProvider } from '../../utils';
import strategies from '..';

export const author = 'xJonathanLEI';
export const version = '0.2.0';

interface Options {
  operands: Operand[] | undefined;
  operation: Operation | undefined;
}

interface LegacyFields {
  strategy: any; // Legacy option used in v0.1.0
}

type Operand = StrategyOperand | ConstantOperand;

enum OperandType {
  Strategy = 'strategy',
  Constant = 'constant'
}

interface StrategyOperand {
  type: OperandType.Strategy;
  strategy: any;
}

interface ConstantOperand {
  type: OperandType.Constant;
  value: number;
}

enum Operation {
  SquareRoot = 'square-root',
  CubeRoot = 'cube-root',
  Min = 'min',
  Max = 'max'
}

const operandCountByOperation: Record<Operation, number> = {
  [Operation.SquareRoot]: 1,
  [Operation.CubeRoot]: 1,
  [Operation.Min]: 2,
  [Operation.Max]: 2
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const strategyOptions: Options = migrateLegacyOptions(options);
  validateOptions(strategyOptions);

  // Recursively resolve operands
  const operandPromises: Promise<
    Record<string, number>
  >[] = strategyOptions.operands!.map((item) =>
    resolveOperand(item, addresses, space, snapshot)
  );
  const resolvedOperands: Record<string, number>[] = await Promise.all(
    operandPromises
  );

  const finalResult: Record<string, number> = resolveOperation(
    strategyOptions.operation!,
    resolvedOperands
  );

  return finalResult;
}

function resolveOperation(
  operation: Operation,
  resolvedOperands: Record<string, number>[]
): Record<string, number> {
  switch (operation) {
    case Operation.SquareRoot: {
      return Object.fromEntries(
        Object.entries(
          resolvedOperands[0]
        ).map(([address, score]: [string, number]) => [
          address,
          Math.sqrt(score)
        ])
      );
    }
    case Operation.CubeRoot: {
      return Object.fromEntries(
        Object.entries(
          resolvedOperands[0]
        ).map(([address, score]: [string, number]) => [
          address,
          Math.cbrt(score)
        ])
      );
    }
    case Operation.Min: {
      return Object.fromEntries(
        Object.entries(
          resolvedOperands[0]
        ).map(([address, score]: [string, number]) => [
          address,
          Math.min(score, resolvedOperands[1][address])
        ])
      );
    }
    case Operation.Max: {
      return Object.fromEntries(
        Object.entries(
          resolvedOperands[0]
        ).map(([address, score]: [string, number]) => [
          address,
          Math.max(score, resolvedOperands[1][address])
        ])
      );
    }
  }
}

async function resolveOperand(
  operand: Operand,
  addresses: string[],
  space: any,
  snapshot: any
): Promise<Record<string, number>> {
  switch (operand.type) {
    case OperandType.Strategy: {
      const strategyOperand: StrategyOperand = operand as StrategyOperand;

      const upstreamResult: Record<string, number> = await strategies[
        strategyOperand.strategy.name
      ].strategy(
        space,
        strategyOperand.strategy.network,
        getProvider(strategyOperand.strategy.network),
        addresses,
        strategyOperand.strategy.params,
        snapshot
      );

      return upstreamResult;
    }
    case OperandType.Constant: {
      const constantOperand: ConstantOperand = operand as ConstantOperand;

      return Object.fromEntries(
        addresses.map((address) => [address, constantOperand.value])
      );
    }
  }
}

function validateOptions(options: Options) {
  if (!options.operands) {
    throw new Error('Field `operands` missing');
  }
  if (!options.operation) {
    throw new Error('Field `operation` missing');
  }
  if (
    options.operation !== Operation.SquareRoot &&
    options.operation !== Operation.CubeRoot &&
    options.operation !== Operation.Min &&
    options.operation !== Operation.Max
  ) {
    throw new Error('Invalid `operation`');
  }

  for (const operand of options.operands) {
    if (
      operand.type !== OperandType.Strategy &&
      operand.type !== OperandType.Constant
    ) {
      throw new Error('Invalid operand type');
    }
  }

  if (options.operands.length !== operandCountByOperation[options.operation]) {
    throw new Error('Operand count mismatch');
  }
}

function migrateLegacyOptions(options: Options & LegacyFields): Options {
  if (options.strategy && options.operands) {
    throw new Error('Only one of `strategy` and `operands` can be used');
  }

  // `strategy` was used in v0.1.0
  if (options.strategy) {
    return {
      operands: [
        {
          type: OperandType.Strategy,
          strategy: options.strategy
        }
      ],
      operation: options.operation
    };
  } else {
    return options;
  }
}
