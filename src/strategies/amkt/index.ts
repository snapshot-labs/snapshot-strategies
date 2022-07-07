import { strategy as erc1155AllBalancesOf } from '../erc1155-all-balances-of';
import { strategy as erc20BalanceOfQuadratic } from '../erc20-balance-of-quadratic';

export const author = 'Alongside-Finance';
export const version = '0.1.0';

const UID = '0xba0439088dc1e75F58e0A7C107627942C15cbb41';
// currently set to USDC, change once mainnet contract deployed
const AMKT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

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

  const sqrtBalances = await erc20BalanceOfQuadratic(
    space,
    network,
    provider,
    addresses,
    { address: AMKT, decimals: 18 },
    snapshot
  );

  return Object.fromEntries(
    addresses.map((address) => [
      address,
      uidBalances[address] * sqrtBalances[address]
    ])
  );
}
