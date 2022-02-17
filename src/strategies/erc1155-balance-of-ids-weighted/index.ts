import { strategy as erc1155BalanceOfIdsStrategy } from '../erc1155-balance-of-ids';

export const author = 'naomsa';
export const version = '1.0.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const score = await erc1155BalanceOfIdsStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  return Object.fromEntries(
    Object.entries(score).map((address) => [
      address[0],
      address[1] * options.weight
    ])
  );
}
