import { strategy as math } from '../math';
import { OperandType, Operation } from '../math/options';

export const author = 'Alongside-Finance';
export const version = '0.1.0';

const UID = '0xba0439088dc1e75F58e0A7C107627942C15cbb41';
const AMKT = '0xBf2d6955Bf8849691F635a29cFF19525FABc683E';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  _options,
  snapshot
): Promise<Record<string, number>> {
  return await math(
    space,
    network,
    provider,
    addresses,
    {
      operands: [
        {
          type: OperandType.Strategy,
          strategy: {
            name: 'erc1155-all-balances-of',
            params: {
              address: UID,
              symbol: 'UID'
            }
          }
        },
        {
          type: OperandType.Strategy,
          strategy: {
            name: 'erc20-balance-of',
            params: {
              address: AMKT,
              decimals: 18
            }
          }
        }
      ],
      operation: Operation.Multiply
    },
    snapshot
  );
}
