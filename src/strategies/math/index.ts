import strategies from '..';

import {
  ConstantOperand,
  migrateLegacyOptions,
  Operand,
  OperandType,
  Operation,
  OptionalOptions,
  Options,
  StrategyOperand,
  validateOptions
} from './options';

export const author = 'xJonathanLEI';
export const version = '0.2.2';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const rawOptions: OptionalOptions = migrateLegacyOptions(options);
  const strategyOptions: Options = validateOptions(rawOptions);

  // Recursively resolve operands
  const operandPromises: Promise<Record<string, number>>[] =
    strategyOptions.operands.map((item) =>
      resolveOperand(item, addresses, space, network, provider, snapshot)
    );
  const resolvedOperands: Record<string, number>[] = await Promise.all(
    operandPromises
  );

  const finalResult: Record<string, number> = resolveOperation(
    strategyOptions.operation,
    resolvedOperands
  );

  return finalResult;
}

function throwDivZero() {
  throw Error('Cannot divide by zero!');
}

function resolveOperation(
  operation: Operation,
  resolvedOperands: Record<string, number>[]
): Record<string, number> {
  switch (operation) {
    case Operation.SquareRoot: {
      return Object.fromEntries(
        Object.entries(resolvedOperands[0]).map(
          ([address, score]: [string, number]) => [address, Math.sqrt(score)]
        )
      );
    }
    case Operation.CubeRoot: {
      return Object.fromEntries(
        Object.entries(resolvedOperands[0]).map(
          ([address, score]: [string, number]) => [address, Math.cbrt(score)]
        )
      );
    }
    case Operation.Min: {
      return Object.fromEntries(
        Object.entries(resolvedOperands[0]).map(
          ([address, score]: [string, number]) => [
            address,
            Math.min(score, resolvedOperands[1][address])
          ]
        )
      );
    }
    case Operation.Max: {
      return Object.fromEntries(
        Object.entries(resolvedOperands[0]).map(
          ([address, score]: [string, number]) => [
            address,
            Math.max(score, resolvedOperands[1][address])
          ]
        )
      );
    }
    case Operation.AIfLtB: {
      return Object.fromEntries(
        Object.entries(resolvedOperands[0]).map(
          ([address, score]: [string, number]) => [
            address,
            score < resolvedOperands[2][address]
              ? resolvedOperands[1][address]
              : score
          ]
        )
      );
    }
    case Operation.AIfLteB: {
      return Object.fromEntries(
        Object.entries(resolvedOperands[0]).map(
          ([address, score]: [string, number]) => [
            address,
            score <= resolvedOperands[2][address]
              ? resolvedOperands[1][address]
              : score
          ]
        )
      );
    }
    case Operation.AIfGtB: {
      return Object.fromEntries(
        Object.entries(resolvedOperands[0]).map(
          ([address, score]: [string, number]) => [
            address,
            score > resolvedOperands[2][address]
              ? resolvedOperands[1][address]
              : score
          ]
        )
      );
    }
    case Operation.AIfGteB: {
      return Object.fromEntries(
        Object.entries(resolvedOperands[0]).map(
          ([address, score]: [string, number]) => [
            address,
            score >= resolvedOperands[2][address]
              ? resolvedOperands[1][address]
              : score
          ]
        )
      );
    }
    case Operation.Multiply: {
      return Object.fromEntries(
        Object.entries(resolvedOperands[0]).map(
          ([address, score]: [string, number]) => [
            address,
            score * resolvedOperands[1][address]
          ]
        )
      );
    }
    case Operation.MINUS: {
      const arr = Object.entries(resolvedOperands[0]).map(
        ([address, score]: [string, number]) => [
          address,
          score > resolvedOperands[1][address]
            ? score - resolvedOperands[1][address]
            : 0
        ]
      );
      return Object.fromEntries(arr);
    }
    case Operation.Divide: {
      const arr = Object.entries(resolvedOperands[0]).map(
        ([address, score]: [string, number]) => [
          address,
          resolvedOperands[1][address] != 0
            ? score / resolvedOperands[1][address]
            : throwDivZero()
        ]
      );
      return Object.fromEntries(arr);
    }
  }
}

async function resolveOperand(
  operand: Operand,
  addresses: string[],
  space: any,
  network: any,
  provider: any,
  snapshot: any
): Promise<Record<string, number>> {
  switch (operand.type) {
    case OperandType.Strategy: {
      const strategyOperand: StrategyOperand = operand as StrategyOperand;

      const upstreamResult: Record<string, number> = await strategies[
        strategyOperand.strategy.name
      ].strategy(
        space,
        strategyOperand.strategy.network ?? network,
        provider,
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
