export type Operand = StrategyOperand | ConstantOperand;

export interface Options {
  operands: Operand[];
  operation: Operation;
}

export interface StrategyOperand {
  type: OperandType.Strategy;
  strategy: any;
}

export interface ConstantOperand {
  type: OperandType.Constant;
  value: number;
}

export enum OperandType {
  Strategy = 'strategy',
  Constant = 'constant'
}

export enum Operation {
  SquareRoot = 'square-root',
  CubeRoot = 'cube-root',
  Min = 'min',
  Max = 'max',
  AIfLtB = 'a-if-lt-b',
  AIfLteB = 'a-if-lte-b',
  AIfGtB = 'a-if-gt-b',
  AIfGteB = 'a-if-gte-b',
  Multiply = 'multiply',
  MINUS = 'minus',
  Divide = 'divide'
}

interface LegacyFields {
  strategy: any; // Legacy option used in v0.1.0
}

export type OptionalOperand = OptionalStrategyOperand | OptionalConstantOperand;

export interface OptionalOptions {
  operands: OptionalOperand[] | undefined;
  operation: Operation | undefined;
}

export interface OptionalStrategyOperand {
  type: OperandType.Strategy | undefined;
  strategy: any | undefined;
}

export interface OptionalConstantOperand {
  type: OperandType.Constant | undefined;
  value: number | undefined;
}

const operandCountByOperation: Record<Operation, number> = {
  [Operation.SquareRoot]: 1,
  [Operation.CubeRoot]: 1,
  [Operation.Multiply]: 2,
  [Operation.Min]: 2,
  [Operation.Max]: 2,
  [Operation.AIfLtB]: 3,
  [Operation.AIfLteB]: 3,
  [Operation.AIfGtB]: 3,
  [Operation.AIfGteB]: 3,
  [Operation.MINUS]: 2,
  [Operation.Divide]: 2
};

export function validateOptions(rawOptions: OptionalOptions): Options {
  if (!rawOptions.operands) {
    throw new Error('Field `operands` missing');
  }
  if (!rawOptions.operation) {
    throw new Error('Field `operation` missing');
  }
  if (
    rawOptions.operation !== Operation.SquareRoot &&
    rawOptions.operation !== Operation.CubeRoot &&
    rawOptions.operation !== Operation.Min &&
    rawOptions.operation !== Operation.Max &&
    rawOptions.operation !== Operation.AIfLtB &&
    rawOptions.operation !== Operation.AIfLteB &&
    rawOptions.operation !== Operation.AIfGtB &&
    rawOptions.operation !== Operation.AIfGteB &&
    rawOptions.operation !== Operation.Multiply &&
    rawOptions.operation !== Operation.MINUS &&
    rawOptions.operation !== Operation.Divide
  ) {
    throw new Error('Invalid `operation`');
  }
  if (
    rawOptions.operands.length !== operandCountByOperation[rawOptions.operation]
  ) {
    throw new Error('Operand count mismatch');
  }

  const options: Options = {
    operands: [],
    operation: rawOptions.operation
  };

  for (const operand of rawOptions.operands) {
    switch (operand.type) {
      case OperandType.Strategy: {
        options.operands.push({
          type: OperandType.Strategy,
          strategy: operand.strategy
        });
        break;
      }
      case OperandType.Constant: {
        if (operand.value === undefined) {
          throw new Error('Invalid constant value');
        }

        options.operands.push({
          type: OperandType.Constant,
          value: operand.value
        });
        break;
      }
      default: {
        throw new Error(`Invalid operand type: ${operand.type}`);
      }
    }
  }

  return options;
}

export function migrateLegacyOptions(
  options: OptionalOptions & LegacyFields
): OptionalOptions {
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
