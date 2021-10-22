import { strategy as multichainStrategy } from '../multichain';

export const author = 'lightninglu10';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const tokens = options.tokenAddresses || [];

  options.strategies = tokens.map((token) => ({
    name: 'erc20-with-balance',
    network: token.network,
    params: {
      address: token.address,
      decimals: token.decimals,
      minBalance: token.minBalance
    }
  }));

  const scores: any = await multichainStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  return Object.fromEntries(
    Object.entries(scores).map((address: any) => [
      address[0],
      address[1] === tokens.length ? 1 : 0
    ])
  );
}
