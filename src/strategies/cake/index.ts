import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'pancake-swap';
export const version = '0.0.1';

const MINIUM_VOTING_POWER = 0.01;
const CAKE_ADDRESS = '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const score = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    {
      address: CAKE_ADDRESS,
      symbol: 'CAKE',
      decimals: 18
    },
    snapshot
  );

  return Object.fromEntries(
    Object.entries(score).map((address: any) => [
      address[0],
      address[1] > MINIUM_VOTING_POWER ? address[1] : 0
    ])
  );
}
