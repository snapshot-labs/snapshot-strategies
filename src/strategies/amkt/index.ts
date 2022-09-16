import { strategy as erc1155AllBalancesOf } from '../erc1155-all-balances-of';
import { strategy as erc20BalanceOf } from '../erc20-balance-of';
import { strategy as math } from '../math';
import { OperandType, Operation } from '../math/options';

export const author = 'Alongside-Finance';
export const version = '0.1.0';

const UID = '0xba0439088dc1e75F58e0A7C107627942C15cbb41';
// currently set to USDC, change once mainnet contract deployed
const AMKT = '0xBf2d6955Bf8849691F635a29cFF19525FABc683E';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  _options,
  snapshot
): Promise<Record<string, number>> {
  const uidBalances: { [address: string]: number } = await erc1155AllBalancesOf(
    space,
    network,
    provider,
    addresses,
    {
      address: UID,
      symbol: 'UID'
    },
    snapshot
  );

  const balances = await erc20BalanceOf(
    space,
    network,
    provider,
    addresses,
    {
      address: AMKT,
      decimals: 18
    },
    snapshot
  );

  return Object.fromEntries(
    addresses.map((address) => [
      address,
      uidBalances[address] * balances[address]
    ])
  );
}
