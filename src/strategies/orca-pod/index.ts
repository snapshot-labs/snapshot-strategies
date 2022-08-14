import { strategy as erc1155BalanceOfIdsWeightedStrategy } from '../erc1155-balance-of-ids-weighted';

export const author = 'snapshot-labs';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const score = await erc1155BalanceOfIdsWeightedStrategy(
    space,
    network,
    provider,
    addresses,
    {
      address: '0x0762aa185b6ed2dca77945ebe92de705e0c37ae3',
      ids: [options.id],
      weight: parseFloat(options.weight || 1)
    },
    snapshot
  );

  return Object.fromEntries(Object.entries(score).map((a) => [a[0], a[1]]));
}
